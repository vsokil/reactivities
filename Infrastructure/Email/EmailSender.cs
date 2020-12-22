using System.Threading.Tasks;
using Application.Interfaces;
using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace Infrastructure.Email
{
    public class EmailSender : IEmailSender
    {
        private readonly IOptions<SendGridSettings> _settings;

        public EmailSender(IOptions<SendGridSettings> settings)
        {
            _settings = settings;
        }

        public async Task SendEmailAsync(string userEmail, string subject, string message)
        {
            var client = new SendGridClient(_settings.Value.Key);
            var msg = new SendGridMessage
            {
                From = new EmailAddress("northgate-ua@outlook.com", _settings.Value.User),
                Subject = subject,
                PlainTextContent = message,
                HtmlContent = message
            };

            msg.AddTo(new EmailAddress(userEmail));
            msg.SetClickTracking(false, false);

            await client.SendEmailAsync(msg);
        }
    }
}