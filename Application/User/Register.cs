using System;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Application.Errors;
using Application.Interfaces;
using Application.Validators;
using Domain;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.User
{
    public class Register
    {
        public class Command : IRequest
        {
            public string DisplayName { get; set; }

            public string UserName { get; set; }

            public string Email { get; set; }

            public string Password { get; set; }

            public string Origin { get; set; }
        }

        public class QueryValidator : AbstractValidator<Command>
        {
            public QueryValidator()
            {
                RuleFor(x => x.DisplayName).NotEmpty();
                RuleFor(x => x.UserName).NotEmpty();
                RuleFor(x => x.Email).NotEmpty().EmailAddress();
                RuleFor(x => x.Password).Password();
            }
        }

        public class Handler : IRequestHandler<Command>
        {
            private readonly UserManager<AppUser> _userManager;
            private readonly IJwtGenerator _jwtGenerator;
            private readonly DataContext _context;
            private readonly IEmailSender _emailSender;

            public Handler(DataContext context, UserManager<AppUser> userManager, IJwtGenerator jwtGenerator, IEmailSender emailSender)
            {
                _context = context;
                _jwtGenerator = jwtGenerator;
                _userManager = userManager;
                _emailSender = emailSender;
            }

            public async Task<Unit> Handle(Command request, CancellationToken cancellationToken)
            {
                var userInUse = false;

                userInUse = await _context.Users.AnyAsync(x => x.Email.ToLower() == request.Email.ToLower());

                if (userInUse)
                {
                    throw new RestException(HttpStatusCode.BadRequest, new { Email = "Email already exists" });
                }

                userInUse = await _context.Users.AnyAsync(x => x.UserName.ToLower() == request.UserName.ToLower());

                if (userInUse)
                {
                    throw new RestException(HttpStatusCode.BadRequest, new { UserName = "UserName already exists" });
                }

                var user = new AppUser
                {
                    DisplayName = request.DisplayName,
                    Email = request.Email,
                    UserName = request.UserName
                };

                var result = await _userManager.CreateAsync(user, request.Password);

                if (!result.Succeeded)
                    throw new Exception("Problem saving changes");

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