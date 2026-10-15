namespace MindFit_Intelligence_Backend.Services
{
    public class OpenAiRutinaClientException : Exception
    {
        public OpenAiRutinaClientException(string message)
            : base(message)
        {
        }
    }
}
