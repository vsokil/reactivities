using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IEmailSender
    {
        Task SendEmailAsync(string userEmail, string subject, string message);
    }
}