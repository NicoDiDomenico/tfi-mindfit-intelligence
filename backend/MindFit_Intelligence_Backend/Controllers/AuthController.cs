using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MindFit_Intelligence_Backend.DTOs.Permisos;
using MindFit_Intelligence_Backend.DTOs.Usuarios;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IValidator<LoginUsuarioDto> _loginValidator;
        private readonly IValidator<ChangePasswordRequestDto> _changePasswordValidator;

        public AuthController(
            IAuthService authService,
            IValidator<LoginUsuarioDto> loginValidator,
            IValidator<ChangePasswordRequestDto> changePasswordValidator)
        {
            _authService = authService;
            _loginValidator = loginValidator;
            _changePasswordValidator = changePasswordValidator;
        }

        /* NO SIRVE --> Front: Endpoint para obtener los permisos y asi cambiar en el front el estado global de los botones y opciones del menú según los permisos del usuario
           USAR MEJOR --> GET api/Permiso y asi traigo todos ls permisos del usuario y no solo los actuales, para tener toda la info en el front y no hacer otra consulta cada vez que se necesite validar un permiso específico
        [Authorize]
        [HttpGet("permisos-actuales")]
        public async Task<ActionResult<PermisosActualizadosDto>> GetPermisosActuales()
        {
            // 1. Extraemos el ID del Claim del usuario logueado
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(userIdString, out int userId))
                return Unauthorized();

            // 2. LLAMADA AL SERVICE (Ahora devuelve el DTO)
            var response = await _authService.ObtenerPermisosActuales(userId);

            // 3. Devolvemos el objeto DTO
            return Ok(response);
        }
        */

        /// <summary>
        /// Login de usuario con JWT.
        /// </summary>
        /// <remarks>
        /// Header requerido:
        /// - X-Gym-Id: ID del gimnasio (ej: 1)
        /// </remarks>
        // Front: Login de usuario, con generación de JWT y Permisos asociados al usuario para validar que puede y no hacer en UI
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<TokenResponseDto>> Login(LoginUsuarioDto loginUsuarioDto)
        {
            // FluentValidation
            var validationResult = await _loginValidator.ValidateAsync(loginUsuarioDto);
            if (!validationResult.IsValid)
                return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

            TokenResponseDto? res = await _authService.LoginAsync(loginUsuarioDto);

            if (res == null)
                return Unauthorized("Usuario o contraseña incorrectos");

            return Ok(res);
        }

        /// <summary>
        /// Refresca el JWT usando refresh token.
        /// </summary>
        /// <remarks>
        /// Header requerido:
        /// - X-Gym-Id: ID del gimnasio (ej: 1)
        /// </remarks>
        // Front: Endpoint para refrescar el token JWT usando el refresh token, sin necesidad de hacer login nuevamente
        [AllowAnonymous]
        [HttpPost("refresh-token")]
        public async Task<ActionResult<TokenResponseDto>> RefreshToken(RefreshTokenRequestDto refreshTokenRequestDto)
        {
            TokenResponseDto? result = await _authService.RefreshTokensAsync(refreshTokenRequestDto);
            if (result is null || result.AccessToken is null || result.RefreshToken is null)
                return Unauthorized("Invalid refresh token.");

            return Ok(result);
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await _authService.LogoutAsync();
            return Ok("Sesión cerrada correctamente.");
        }

        /// <summary>
        /// Solicita reset de contraseña.
        /// </summary>
        /// <remarks>
        /// Header requerido:
        /// - X-Gym-Id: ID del gimnasio (ej: 1)
        /// </remarks>
        // Front: Endpoint para solicitar reseteo de contraseña, se envía un email con un token seguro para resetear la contraseña sin revelar si el email existe o no
        // requiere header X-Gym-Id string(header)
        [AllowAnonymous]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordRequestDto forgotPasswordRequestDto)
        {
            await _authService.ForgotPasswordAsync(forgotPasswordRequestDto);
            return Ok("Se enviaron instrucciones para recuperar la contraseña.");
            // Siempre respondemos con éxito para evitar revelar si el email existe o no
        }

        /// <summary>
        /// Resetea la contraseña con token de recuperación.
        /// </summary>
        /// <remarks>
        /// Header requerido:
        /// - X-Gym-Id: ID del gimnasio (ej: 1)
        /// </remarks>
        // Front: Endpoint para resetear la contraseña usando el token enviado por email
        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequestDto resetPasswordRequestDto)
        {
            bool rta = await _authService.ResetPasswordAsync(resetPasswordRequestDto);

            return rta == true
                ? Ok("Contraseña reseteada correctamente.")
                : BadRequest("Token inválido o expirado.");
        }

        /// <summary>
        /// Cambia contraseña de responsable autenticado.
        /// </summary>
        /// <remarks>
        /// Header opcional:
        /// - X-Gym-Id: Si no se envía, se lee del JWT (recomendado no enviarlo)
        /// </remarks>
        // Front: Endpoint para cambiar la contraseña autenticado dentro del sistema, requiere la contraseña actual
        //[Authorize(Policy = "CambiarContrasenaResponsable")]
        [Authorize]
        [HttpPost("responsables/change-password")]
        public async Task<IActionResult> ChangePasswordResponsable(ChangePasswordRequestDto dto)
        {
            // FluentValidation
            var validationResult = await _changePasswordValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
                return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

            // Obtenemos el IdUsuario del token JWT
            string? claimIdUsuario = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            // Validamos que el claim exista y sea un número entero
            if (!int.TryParse(claimIdUsuario, out int idUsuario))
                return Unauthorized();

            // Llamamos al servicio para cambiar la contraseña
            bool rta = await _authService.ChangePasswordAsync(idUsuario, dto);

            return rta == true
                ? Ok("Contraseña cambiada correctamente.")
                : BadRequest("La contraseña actual es incorrecta.");
        }

        // NUEVO --> Front: Endpoint para cambiar la contraseña de un responsable desde el panel de administración, requiere la contraseña actual
        [Authorize(Policy = "CambiarContrasenaResponsable")]
        [HttpPost("responsables/{idUsuario:int}/change-password")]
        public async Task<IActionResult> ChangePasswordResponsableSeleccionado(int idUsuario, ChangePasswordRequestDto dto)
        {
            var validationResult = await _changePasswordValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
                return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

            bool rta = await _authService.ChangePasswordAsync(idUsuario, dto);

            return rta
                ? Ok("Contraseña cambiada correctamente.")
                : BadRequest("La contraseña actual es incorrecta.");
        }

        /// <summary>
        /// Cambia contraseña de socio autenticado.
        /// </summary>
        /// <remarks>
        /// Header opcional:
        /// - X-Gym-Id: Si no se envía, se lee del JWT (recomendado no enviarlo)
        /// </remarks>
        // Front: Endpoint para cambiar la contraseña autenticado dentro del sistema, requiere la contraseña actual
        //[Authorize(Policy = "CambiarContrasenaSocio")]
        [Authorize]
        [HttpPost("socio/change-password")]
        public async Task<IActionResult> ChangePasswordSocio(ChangePasswordRequestDto dto)
        {
            // FluentValidation
            var validationResult = await _changePasswordValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
                return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

            // Obtenemos el IdUsuario del token JWT
            string? claimIdUsuario = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            // Validamos que el claim exista y sea un número entero
            if (!int.TryParse(claimIdUsuario, out int idUsuario))
                return Unauthorized();

            // Llamamos al servicio para cambiar la contraseña
            bool rta = await _authService.ChangePasswordAsync(idUsuario, dto);

            return rta == true
                ? Ok("Contraseña cambiada correctamente.")
                : BadRequest("La contraseña actual es incorrecta.");
        }

        // NUEVO --> Front: Endpoint para cambiar la contraseña de un socio desde el panel de administración, requiere la contraseña actual
        [Authorize(Policy = "CambiarContrasenaSocio")]
        [HttpPost("socio/{idUsuario:int}/change-password")]
        public async Task<IActionResult> ChangePasswordSocioSeleccionado(int idUsuario, ChangePasswordRequestDto dto)
        {
            var validationResult = await _changePasswordValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
                return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));

            bool rta = await _authService.ChangePasswordAsync(idUsuario, dto);

            return rta
                ? Ok("Contraseña cambiada correctamente.")
                : BadRequest("La contraseña actual es incorrecta.");
        }
    }
}
