namespace MindFit_Intelligence_Backend.Services
{
    public class GymOnboardingConflictException : Exception
    {
        public GymOnboardingConflictException(string message)
            : base(message)
        {
        }

        public GymOnboardingConflictException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}
