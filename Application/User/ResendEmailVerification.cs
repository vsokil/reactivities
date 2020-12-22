using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Application.Errors;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;

namespace Application.User
{
    public class ResendEmailVerification
    {
        public class Query : IRequest
        {
            public string Email { get; set; }

            public string Origin { get; set; }
        }

        public class Handler : IRequestHandler<Query>
        {
            private readonly UserManager<AppUser> _userManager;
            private readonly IEmailSender _emailSender;

            public Handler(UserManager<AppUser> userManager, IEmailSender emailSender)
            {
                _userManager = userManager;
                _emailSender = emailSender;
            }

            public async Task<Unit> Handle(Query request, CancellationToken cancellationToken)
            {
                var user = await _userManager.FindByEmailAsync(request.Email);

                if (user == null)
                    throw new RestException(HttpStatusCode.NotFound, new { User = "Not found" });

                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                token = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

                var verifyUrl = $"{request.Origin}/user/verifyEmail?token={token}&email={request.Email}";
                var message = $@"<p>Please click below link to verify email address:</p>
                                <p><a href='{verifyUrl}'>{verifyUrl}</a></p>";

                await _emailSender.SendEmailAsync(request.Email, "Pleaase verify email address", message);

                return Unit.Value;
            }
        }
    }
}