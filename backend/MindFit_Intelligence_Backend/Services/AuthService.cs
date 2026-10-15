using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using MindFit_Intelligence_Backend.DTOs.Permisos;
using MindFit_Intelligence_Backend.DTOs.Usuarios;
using MindFit_Intelligence_Backend.Models;
using MindFit_Intelligence_Backend.Repository.Interfaces;
using MindFit_Intelligence_Backend.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace MindFit_Intelligence_Backend.Services
{
    public class AuthService : IAuthService
    {
        private readonly IConfiguration _configuration;
        private IUsuarioRepository _usuarioRepository;
        private readonly IPersonaResponsableRepository _personaResponsableRepository;
        private readonly IPersonaSocioRepository _personaSocioRepository;
        private readonly IEmailService _emailService;
        private readonly ITenantContext? _tenantContext; // inyectado para leer IdGimnasio
        private readonly IAuditoriaService _auditoriaService;

        public AuthService(IConfiguration configuration,
            IUsuarioRepository usuarioRepository,
            IPersonaResponsableRepository personaResponsableRepository,
            IPersonaSocioRepository personaSocioRepository,
            IEmailService emailService,
            IAuditoriaService auditoriaService,
            ITenantContext? tenantContext = null) // inyectable opcional para compatibilidad
        {
            _configuration = configuration;
            _usuarioRepository = usuarioRepository;
            _personaResponsableRepository = personaResponsableRepository;
            _personaSocioRepository = personaSocioRepository;
            _emailService = emailService;
            _auditoriaService = auditoriaService;
            _tenantContext = tenantContext;
        }

        #region Register
        public void SetPasswordHash(Usuario usuario, UsuarioInsertDto usuarioInsertDto)
        {
            usuario.PasswordHash = new PasswordHasher<Usuario>()
                .HashPassword(usuario, usuarioInsertDto.Password);
        }
        #endregion

        #region Login
        public string CreateToken(Usuario usuario)
        {
            // JWT: HEADER + PAYLOAD + SIGNATURE

            // 🔹 1.1) CLAIMS --> Información para contruir el PAYLOAD
            // Estos datos no están cifrados, cualquiera puede leerlos si tiene el token.
            // Lo que garantiza seguridad no es ocultarlos, sino la FIRMA.
            List<Claim> claims = new List<Claim>
            {
                // Identificador único del usuario
                new Claim(ClaimTypes.NameIdentifier, usuario.IdUsuario.ToString()),

                // Username visible en el token
                new Claim(ClaimTypes.Name, usuario.Username),
            };

            // 1.2) Roles desde BD - Lo voy a usar para el rol Socio:
            // Esto sirve para que 'RequireRole' funcione en el Program.cs
            if (usuario.UsuarioGrupos != null)
            {
                var roles = usuario.UsuarioGrupos
                    .Select(ug => ug.Grupo?.Nombre)
                    .Where(nombre => !string.IsNullOrWhiteSpace(nombre))
                    .Distinct();

                foreach (var rol in roles)
                {
                    claims.Add(new Claim(ClaimTypes.Role, rol!));
                }
            }

            // Agregar IdGimnasio desde TenantContext si está disponible
            if (_tenantContext?.IdGimnasio != null)
            {
                claims.Add(new Claim("IdGimnasio", _tenantContext.IdGimnasio.Value.ToString()));
            }

            // 🔹 2) CLAVE SECRETA --> Información para contruir las CREDENCIALES DE FIRMA
            // Esta clave se usa para generar la FIRMA(SIGNATURE) del token.
            // NO cifra el token. Solo se usa para firmarlo.
            // Clave secreta y firma
            SymmetricSecurityKey key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    _configuration.GetValue<string>("AppSettings:Token")!
                )
            );

            // 🔹 3) CREDENCIALES DE FIRMA (Signing Credentials) --> Información para contruir el HEADER y la SIGNATURE
            // HmacSha512 significa:
            // - Se va a usar HMAC (Hash-based Message Authentication Code)
            // - Con el algoritmo SHA-512 (genera 512 bits)
            // Esto NO cifra el contenido, solo genera la firma.
            SigningCredentials creds = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha512
            );

            // 🔹 4) CONSTRUCCIÓN DE LA PARTE 1 Y 2 DEL TOKEN --> (HEADER + PAYLOAD)
            // Acá todavía NO existe la firma.
            // Solo estamos definiendo:
            // - quién lo emite (issuer)
            // - quién lo consume (audience)
            // - qué datos lleva (claims)
            // - cuándo expira
            // - cómo se va a firmar
            JwtSecurityToken tokenDescriptor = new JwtSecurityToken(
                issuer: _configuration.GetValue<string>("AppSettings:Issuer"),
                audience: _configuration.GetValue<string>("AppSettings:Audience"),
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1),
                signingCredentials: creds
            );

            // 🔹 5) GENERACIÓN REAL DEL JWT STRING --> HEADER.PAYLOAD.SIGNATURE
            // Acá internamente ocurre esto:
            //
            // 1) Se crea el HEADER automáticamente:
            //    { "alg": "HS512", "typ": "JWT" }
            //
            // 2) Se convierte header y payload a Base64Url
            //
            // 3) Se genera la FIRMA:
            //    signature = HMACSHA512(secretKey, header.payload)
            //
            // 4) Se devuelve:
            //    header.payload.signature
            string token = new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
            return token;
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private async Task<string> GenerateAndSaveRefreshTokenAsync(Usuario usuario)
        {
            var refreshToken = GenerateRefreshToken();
            usuario.RefreshToken = refreshToken;
            usuario.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _usuarioRepository.Save();
            return refreshToken;
        }

        private async Task<TokenResponseDto> CreateTokenResponse(Usuario usuario)
        {
            var listaPermisos = await _usuarioRepository.GetNombresPermisosByUsuario(usuario.IdUsuario);

            var response = new TokenResponseDto
            {
                // El AccessToken sirve para autenticar al usuario en cada petición
                AccessToken = CreateToken(usuario),

                //  El RefreshToken sirve para obtener un nuevo AccessToken cuando este expire
                RefreshToken = await GenerateAndSaveRefreshTokenAsync(usuario),

                // Lista de permisos del usuario para mostrar en el front y controlar la visibilidad de ciertas opciones
                Permisos = listaPermisos,

                DatosPersonales = new DatosPersonalesDto
                {
                    Id = usuario.IdUsuario,

                    // OPTIMIZACIÓN: El operador '??' significa "Si lo de la izquierda es nulo, usa lo de la derecha"
                    Nombre = usuario.PersonaSocio?.Nombre ?? usuario.PersonaResponsable?.Nombre,
                    Apellido = usuario.PersonaSocio?.Apellido ?? usuario.PersonaResponsable?.Apellido,

                    Rol = usuario.UsuarioGrupos?
                .Select(ug => ug.Grupo?.Nombre)
                .Where(nombre => !string.IsNullOrWhiteSpace(nombre))
                .Select(nombre => nombre!) // <--- LA SOLUCIÓN: El '!' fuerza la conversión de string? a string
                .Distinct()
                .ToList()
                }
            };

            return response;
        }

        public async Task<TokenResponseDto?> LoginAsync(LoginUsuarioDto loginUsuarioDto)
        {
            // Busco el usuario por username
            Usuario? usuario = await _usuarioRepository.GetByUsername(loginUsuarioDto.Username);

            if (usuario == null)
            {
                await _auditoriaService.RegistrarSesionAsync(
                    "LoginFallido",
                    "Fallido",
                    loginUsuarioDto.Username,
                    motivoFallo: "Usuario o contraseña incorrectos");
                return null;
            }

            // Verifico la contraseña
            var result = new PasswordHasher<Usuario>()
                .VerifyHashedPassword(usuario, usuario.PasswordHash, loginUsuarioDto.Password);

            if (result == PasswordVerificationResult.Failed)
            {
                await _auditoriaService.RegistrarSesionAsync(
                    "LoginFallido",
                    "Fallido",
                    loginUsuarioDto.Username,
                    usuario.IdUsuario,
                    "Usuario o contraseña incorrectos");
                return null; // contraseña incorrecta
            }

            // Usando Resfreh JWT, se Genera el AccessToken + RefreshToken para el usuario
            TokenResponseDto response = await CreateTokenResponse(usuario);
            await _auditoriaService.RegistrarSesionAsync(
                "LoginExitoso",
                "Exitoso",
                usuario.Username,
                usuario.IdUsuario);

            return response;
        }
        #endregion

        #region Refresh Token
        public async Task<TokenResponseDto?> RefreshTokensAsync(RefreshTokenRequestDto request)
        {
            Usuario? usuario = await ValidateRefreshTokenAsync(request.IdUsuario, request.RefreshToken);
            if (usuario == null)
                return null; // token inválido o expirado

            TokenResponseDto response = await CreateTokenResponse(usuario);
            await _auditoriaService.RegistrarSesionAsync(
                "RefreshToken",
                "Exitoso",
                usuario.Username,
                usuario.IdUsuario);

            return response;
        }

        public async Task LogoutAsync()
        {
            await _auditoriaService.RegistrarSesionAsync(
                "Logout",
                "Exitoso",
                null);
        }

        private async Task<Usuario?> ValidateRefreshTokenAsync(int userId, string refreshToken)
        {
            Usuario? usuario = await _usuarioRepository.GetById(userId);
            if (usuario == null
                || usuario.RefreshToken != refreshToken
                || usuario.RefreshTokenExpiryTime <= DateTime.UtcNow)
                return null; // token inválido o expirado
            return usuario;
        }
        #endregion

        #region Recuperar Resetear Cambiar Clave
        private static string Sha256Hex(string input)
        {
            // Convierte el texto en bytes (formato que entiende el algoritmo)
            byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));

            // Convierte el hash en texto hexadecimal para poder guardarlo en la base
            return Convert.ToHexString(bytes); // siempre da 64 caracteres
        }
        private static string GenerateSecureToken()
        {
            // Genera 32 bytes completamente aleatorios y seguros
            byte[] bytes = RandomNumberGenerator.GetBytes(32);

            // Los convierte a texto para poder mandarlos por mail o link
            return Convert.ToBase64String(bytes);
        }

        public async Task ForgotPasswordAsync(ForgotPasswordRequestDto dto)
        {
            string email = dto.Email;

            // 1) Buscar persona (Responsable o Socio)
            int? idUsuario = null;
            string? emailDestino = null;

            PersonaResponsable? pr = await _personaResponsableRepository.GetByEmail(email);
            if (pr != null)
            {
                idUsuario = pr.IdUsuario;
                emailDestino = pr.Email;
            }
            else
            {
                PersonaSocio? ps = await _personaSocioRepository.GetByEmail(email);
                if (ps != null)
                {
                    idUsuario = ps.IdUsuario;
                    emailDestino = ps.Email;
                }
            }

            if (idUsuario == null) return;

            // 2) Buscar usuario
            Usuario? usuario = await _usuarioRepository.GetById(idUsuario.Value);
            if (usuario == null) return;

            // 3) Generar token plano + hash
            string tokenPlano = GenerateSecureToken();
            string tokenHasheado = Sha256Hex(tokenPlano);

            usuario.PasswordResetTokenHash = tokenHasheado;
            usuario.PasswordResetTokenExpiryTime = DateTime.UtcNow.AddMinutes(15);

            usuario.RefreshToken = null;
            usuario.RefreshTokenExpiryTime = null;

            await _usuarioRepository.Save();

            // 4) Link al front
            var frontendBaseUrl = _configuration["AppSettings:FrontendBaseUrl"]!.TrimEnd('/');

            if (_tenantContext?.IdGimnasio is null)
                throw new InvalidOperationException("No se pudo resolver el Id del gimnasio para generar el link de recuperación.");

            var gymId = _tenantContext.IdGimnasio.Value;

            var resetLink =
                $"{frontendBaseUrl}/reset-password?token={Uri.EscapeDataString(tokenPlano)}&gymId={gymId}";

            // 5) Enviar mail
            var subject = "Recuperación de contraseña - MindFit";
            var html = $@"
                <h2>Recuperación de contraseña</h2>
                <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                <p>Hacé clic en este enlace para elegir una nueva contraseña (vence en 15 minutos):</p>
                <p><a href=""{resetLink}"">Restablecer contraseña</a></p>
                <p>Si vos no pediste esto, ignorá este correo.</p>
            ";

            await _emailService.SendAsync(emailDestino!, subject, html);
        }

        // Lo que se hace ne este metodo:
        // ResetPasswordAsync: El usuario hace clic en el link del mail, ingresa su nueva contraseña y el token que viene en el link. El backend recibe ese token, lo hashea y busca un usuario que tenga ese hash guardado. Si lo encuentra y el token no expiró, le permite cambiar la contraseña.
        public async Task<bool> ResetPasswordAsync(ResetPasswordRequestDto dto)
        {
            string tokenHasheado = Sha256Hex(dto.TokenPlano);

            Usuario? usuario = await _usuarioRepository.GetByPasswordResetTokenHash(tokenHasheado);
            if (usuario == null)
                return false;

            if (usuario.PasswordResetTokenExpiryTime == null ||
                usuario.PasswordResetTokenExpiryTime <= DateTime.UtcNow)
                return false;

            // PasswordHasher lo habiamos usado tanto en el Register como en el Login
            usuario.PasswordHash = new PasswordHasher<Usuario>()
                .HashPassword(usuario, dto.NewPassword);

            // Invalida el token de reseteo para que no se pueda usar dos veces
            usuario.PasswordResetTokenHash = null;
            usuario.PasswordResetTokenExpiryTime = null;

            // El RefreshToken se asignará luego en el Login
            usuario.RefreshToken = null;
            usuario.RefreshTokenExpiryTime = null;

            await _usuarioRepository.Save();
            return true;
        }

        public async Task<bool> ChangePasswordAsync(int idUsuario, ChangePasswordRequestDto dto)
        {
            Usuario? usuario = await _usuarioRepository.GetById(idUsuario);
            if (usuario == null) return false;

            // Verifico que la contraseña actual que el usuario ingresó coincida con su contraseña real (hash)
            PasswordVerificationResult result = new PasswordHasher<Usuario>()
                .VerifyHashedPassword(usuario, usuario.PasswordHash, dto.CurrentPassword);

            if (result == PasswordVerificationResult.Failed)
                return false;

            // Si la contraseña actual es correcta, se hashea la nueva contraseña y se guarda en la BD
            usuario.PasswordHash = new PasswordHasher<Usuario>()
                .HashPassword(usuario, dto.NewPassword);

            usuario.RefreshToken = null;
            usuario.RefreshTokenExpiryTime = null;

            await _usuarioRepository.Save();
            return true;
        }
        #endregion

        public async Task<PermisosActualizadosDto> ObtenerPermisosActuales(int idUsuario)
        {
            // El repo sigue devolviendo la List<string>
            var lista = await _usuarioRepository.GetNombresPermisosByUsuario(idUsuario);

            // El Service la envuelve en el DTO
            return new PermisosActualizadosDto
            {
                Permisos = lista
            };
        }
    }
}
