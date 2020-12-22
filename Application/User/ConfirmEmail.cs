using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Domain;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;

namespace Application.User
{
    public class ConfirmEmail
    {
        public class Command : IRequest<IdentityResult>
        {
            public string Token { get; set; }

            public string Email { get; set; }
        }

        public class CommandValidator : AbstractValidator<Command>
        {
            public CommandValidator()
            {
                RuleFor(x => x.Email).NotEmpty();
                RuleFor(x => x.Token).NotEmpty();
            }
        }

        public class Handler : IRequestHandler<Command, IdentityResult>
        {
            private readonly UserManager<AppUser> _userManage;

            public Handler(UserManager<AppUser> userManager)
            {
                _userManage = userManager;
            }

            public async Task<IdentityResult> Handle(Command command, CancellationToken cancellationToken)
            {
                var user = await _userManage.FindByEmailAsync(command.Email);
                var decodedTokenBytes = WebEncoders.Base64UrlDecode(command.Token);
                var decodedToken = Encoding.UTF8.GetString(decodedTokenBytes);

                return await _userManage.ConfirmEmailAsync(user, decodedToken);
            }
        }
    }
}