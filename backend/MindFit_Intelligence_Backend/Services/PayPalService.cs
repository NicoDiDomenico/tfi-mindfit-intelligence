using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Globalization;
using System.Text;
using System.Text.Json;
using MindFit_Intelligence_Backend.DTOs.PayPal;
using MindFit_Intelligence_Backend.Services.Interfaces;

namespace MindFit_Intelligence_Backend.Services
{
    public class PayPalService : IPayPalService
    {
        private const string Currency = "USD";
        private const string SetupFee = "320.00";
        private const string MonthlyFee = "160.00";
        private const int ActiveSubscriptionMaxAttempts = 4;
        private static string? generatedPlanId;
        private static string? generatedResubscriptionPlanId;
        private static string? generatedProductId;

        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PayPalService> _logger;

        public PayPalService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<PayPalService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<PayPalConfigDto> GetConfigAsync(bool allowPlanCreation)
        {
            var clientId = GetRequiredSetting("PayPal:ClientId");
            var planId = GetConfiguredInitialPlanId() ?? generatedPlanId;

            if (string.IsNullOrWhiteSpace(planId) && allowPlanCreation)
            {
                var plan = await EnsurePlanAsync();
                planId = plan.PlanId;
            }

            if (string.IsNullOrWhiteSpace(planId))
                throw new InvalidOperationException("PayPal:InitialPlanId o PayPal:PlanId no esta configurado.");

            return new PayPalConfigDto
            {
                ClientId = clientId,
                PlanId = planId,
                Currency = Currency
            };
        }

        public async Task<PayPalConfigDto> GetResubscriptionConfigAsync(bool allowPlanCreation)
        {
            var clientId = GetRequiredSetting("PayPal:ClientId");
            var planId = GetConfiguredResubscriptionPlanId() ?? generatedResubscriptionPlanId;

            if (string.IsNullOrWhiteSpace(planId) && allowPlanCreation)
            {
                var plan = await EnsureResubscriptionPlanAsync();
                planId = plan.PlanId;
            }

            if (string.IsNullOrWhiteSpace(planId))
                throw new InvalidOperationException("PayPal:ResubscriptionPlanId no esta configurado.");

            return new PayPalConfigDto
            {
                ClientId = clientId,
                PlanId = planId,
                Currency = Currency
            };
        }

        public async Task<PayPalPlanDto> EnsurePlanAsync()
        {
            var configuredPlanId = GetConfiguredInitialPlanId();
            if (!string.IsNullOrWhiteSpace(configuredPlanId))
            {
                return new PayPalPlanDto
                {
                    ProductId = generatedProductId ?? string.Empty,
                    PlanId = configuredPlanId,
                    Created = false
                };
            }

            if (!string.IsNullOrWhiteSpace(generatedPlanId))
            {
                return new PayPalPlanDto
                {
                    ProductId = generatedProductId ?? string.Empty,
                    PlanId = generatedPlanId,
                    Created = false
                };
            }

            var accessToken = await GetAccessTokenAsync();
            var productId = await CreateProductAsync(accessToken);
            var planId = await CreatePlanAsync(accessToken, productId, includeSetupFee: true);

            generatedProductId = productId;
            generatedPlanId = planId;

            _logger.LogInformation("Plan PayPal sandbox creado: {PlanId}", planId);

            return new PayPalPlanDto
            {
                ProductId = productId,
                PlanId = planId,
                Created = true
            };
        }

        public async Task<PayPalPlanDto> EnsureResubscriptionPlanAsync()
        {
            var configuredPlanId = GetConfiguredResubscriptionPlanId();
            if (!string.IsNullOrWhiteSpace(configuredPlanId))
            {
                return new PayPalPlanDto
                {
                    ProductId = generatedProductId ?? string.Empty,
                    PlanId = configuredPlanId,
                    Created = false
                };
            }

            if (!string.IsNullOrWhiteSpace(generatedResubscriptionPlanId))
            {
                return new PayPalPlanDto
                {
                    ProductId = generatedProductId ?? string.Empty,
                    PlanId = generatedResubscriptionPlanId,
                    Created = false
                };
            }

            var accessToken = await GetAccessTokenAsync();
            var productId = generatedProductId ?? await CreateProductAsync(accessToken);
            var planId = await CreatePlanAsync(accessToken, productId, includeSetupFee: false);

            generatedProductId = productId;
            generatedResubscriptionPlanId = planId;

            _logger.LogInformation("Plan PayPal sandbox de resuscripcion creado: {PlanId}", planId);

            return new PayPalPlanDto
            {
                ProductId = productId,
                PlanId = planId,
                Created = true
            };
        }

        public async Task<PayPalSubscriptionStatusDto> GetSubscriptionStatusAsync(
            string subscriptionId,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(subscriptionId))
                throw new ArgumentException("El id de suscripcion PayPal es obligatorio.", nameof(subscriptionId));

            var accessToken = await GetAccessTokenAsync();
            using var request = CreateRequest(HttpMethod.Get, $"/v1/billing/subscriptions/{Uri.EscapeDataString(subscriptionId)}", accessToken);
            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var payload = await ReadJsonResponseAsync(response);

            var status = payload.RootElement.GetProperty("status").GetString() ?? "UNKNOWN";
            var isActive = status.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase);

            return new PayPalSubscriptionStatusDto
            {
                SubscriptionId = subscriptionId,
                PlanId = TryGetString(payload.RootElement, "plan_id"),
                Status = status,
                IsActive = isActive,
                IsApproved = isActive || status.Equals("APPROVED", StringComparison.OrdinalIgnoreCase),
                NextBillingTimeUtc = TryGetNestedUtcDateTime(
                    payload.RootElement,
                    "billing_info",
                    "next_billing_time"),
                StatusUpdateTimeUtc = TryGetUtcDateTime(payload.RootElement, "status_update_time"),
                LastVerificationPayPalUtc = DateTime.UtcNow
            };
        }

        public async Task<PayPalSubscriptionStatusDto> WaitForActiveSubscriptionAsync(
            string subscriptionId,
            CancellationToken cancellationToken = default)
        {
            PayPalSubscriptionStatusDto status = await GetSubscriptionStatusAsync(subscriptionId, cancellationToken);

            for (var attempt = 1; attempt < ActiveSubscriptionMaxAttempts && !status.IsActive; attempt++)
            {
                if (!status.Status.Equals("APPROVED", StringComparison.OrdinalIgnoreCase))
                    return status;

                await Task.Delay(TimeSpan.FromMilliseconds(1200), cancellationToken);
                status = await GetSubscriptionStatusAsync(subscriptionId, cancellationToken);
            }

            return status;
        }

        public async Task<PayPalSubscriptionStatusDto> CancelSubscriptionAsync(
            string subscriptionId,
            string reason,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(subscriptionId))
                throw new ArgumentException("El id de suscripcion PayPal es obligatorio.", nameof(subscriptionId));

            var accessToken = await GetAccessTokenAsync();
            var body = new { reason };
            using var request = CreateRequest(
                HttpMethod.Post,
                $"/v1/billing/subscriptions/{Uri.EscapeDataString(subscriptionId)}/cancel",
                accessToken,
                body);

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            await EnsureSuccessResponseAsync(response);

            return await GetSubscriptionStatusAsync(subscriptionId, cancellationToken);
        }

        public async Task<PayPalSubscriptionStatusDto> ActivateSubscriptionAsync(
            string subscriptionId,
            string reason,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(subscriptionId))
                throw new ArgumentException("El id de suscripcion PayPal es obligatorio.", nameof(subscriptionId));

            var accessToken = await GetAccessTokenAsync();
            var body = new { reason };
            using var request = CreateRequest(
                HttpMethod.Post,
                $"/v1/billing/subscriptions/{Uri.EscapeDataString(subscriptionId)}/activate",
                accessToken,
                body);

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            await EnsureSuccessResponseAsync(response);

            return await GetSubscriptionStatusAsync(subscriptionId, cancellationToken);
        }

        private async Task<string> CreateProductAsync(string accessToken)
        {
            var body = new
            {
                name = "MindFit Intelligence",
                description = "Alta y suscripcion mensual a MindFit Intelligence",
                type = "SERVICE",
                category = "SOFTWARE"
            };

            using var request = CreateRequest(HttpMethod.Post, "/v1/catalogs/products", accessToken, body);
            request.Headers.Add("PayPal-Request-Id", $"mindfit-product-{Guid.NewGuid():N}");
            using var response = await _httpClient.SendAsync(request);
            var payload = await ReadJsonResponseAsync(response);

            return payload.RootElement.GetProperty("id").GetString()
                ?? throw new InvalidOperationException("PayPal no devolvio id de producto.");
        }

        private async Task<string> CreatePlanAsync(string accessToken, string productId, bool includeSetupFee)
        {
            var paymentPreferences = new Dictionary<string, object>
            {
                ["auto_bill_outstanding"] = true,
                ["setup_fee_failure_action"] = "CANCEL",
                ["payment_failure_threshold"] = 3
            };

            if (includeSetupFee)
            {
                paymentPreferences["setup_fee"] = new
                {
                    value = SetupFee,
                    currency_code = Currency
                };
            }

            var body = new
            {
                product_id = productId,
                name = includeSetupFee
                    ? "MindFit Intelligence - Alta y plan mensual"
                    : "MindFit Intelligence - Plan mensual retorno",
                description = includeSetupFee
                    ? "USD 320 de alta y USD 160 mensuales"
                    : "USD 160 mensuales sin cargo de instalacion",
                status = "ACTIVE",
                billing_cycles = new[]
                {
                    new
                    {
                        frequency = new
                        {
                            interval_unit = "MONTH",
                            interval_count = 1
                        },
                        tenure_type = "REGULAR",
                        sequence = 1,
                        total_cycles = 0,
                        pricing_scheme = new
                        {
                            fixed_price = new
                            {
                                value = MonthlyFee,
                                currency_code = Currency
                            }
                        }
                    }
                },
                payment_preferences = paymentPreferences
            };

            using var request = CreateRequest(HttpMethod.Post, "/v1/billing/plans", accessToken, body);
            request.Headers.Add("PayPal-Request-Id", $"mindfit-plan-{Guid.NewGuid():N}");
            using var response = await _httpClient.SendAsync(request);
            var payload = await ReadJsonResponseAsync(response);

            return payload.RootElement.GetProperty("id").GetString()
                ?? throw new InvalidOperationException("PayPal no devolvio id de plan.");
        }

        private async Task<string> GetAccessTokenAsync()
        {
            var clientId = GetRequiredSetting("PayPal:ClientId");
            var clientSecret = GetRequiredSetting("PayPal:ClientSecret");

            using var request = new HttpRequestMessage(HttpMethod.Post, "/v1/oauth2/token");
            var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{clientId}:{clientSecret}"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
            request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "client_credentials"
            });

            using var response = await _httpClient.SendAsync(request);
            var payload = await ReadJsonResponseAsync(response);

            return payload.RootElement.GetProperty("access_token").GetString()
                ?? throw new InvalidOperationException("PayPal no devolvio access_token.");
        }

        private HttpRequestMessage CreateRequest(HttpMethod method, string path, string accessToken, object? body = null)
        {
            var request = new HttpRequestMessage(method, path);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            if (body is not null)
                request.Content = JsonContent.Create(body);

            return request;
        }

        private async Task<JsonDocument> ReadJsonResponseAsync(HttpResponseMessage response)
        {
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException($"PayPal respondio {(int)response.StatusCode}: {content}");

            return JsonDocument.Parse(content);
        }

        private static async Task EnsureSuccessResponseAsync(HttpResponseMessage response)
        {
            if (response.IsSuccessStatusCode)
                return;

            var content = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"PayPal respondio {(int)response.StatusCode}: {content}");
        }

        private string GetRequiredSetting(string key)
        {
            return _configuration[key]
                ?? throw new InvalidOperationException($"{key} no esta configurado.");
        }

        private string? GetConfiguredInitialPlanId()
        {
            var planId = _configuration["PayPal:InitialPlanId"];
            if (string.IsNullOrWhiteSpace(planId))
                planId = _configuration["PayPal:PlanId"];

            return string.IsNullOrWhiteSpace(planId) ? null : planId;
        }

        private string? GetConfiguredResubscriptionPlanId()
        {
            var planId = _configuration["PayPal:ResubscriptionPlanId"];
            return string.IsNullOrWhiteSpace(planId) ? null : planId;
        }

        private static string? TryGetString(JsonElement element, string propertyName)
        {
            if (!element.TryGetProperty(propertyName, out var valueElement)
                || valueElement.ValueKind != JsonValueKind.String)
                return null;

            return valueElement.GetString();
        }

        private static DateTime? TryGetNestedUtcDateTime(
            JsonElement element,
            string objectPropertyName,
            string datePropertyName)
        {
            if (!element.TryGetProperty(objectPropertyName, out var nestedElement))
                return null;

            return TryGetUtcDateTime(nestedElement, datePropertyName);
        }

        private static DateTime? TryGetUtcDateTime(JsonElement element, string propertyName)
        {
            if (!element.TryGetProperty(propertyName, out var valueElement)
                || valueElement.ValueKind != JsonValueKind.String)
                return null;

            var value = valueElement.GetString();
            if (string.IsNullOrWhiteSpace(value))
                return null;

            return DateTime.TryParse(
                value,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                out var dateTime)
                ? dateTime
                : null;
        }
    }
}
