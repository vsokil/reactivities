using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Application.Errors;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Followers
{
    public class Delete
    {
        public class Command : IRequest
        {
            public string UserName { get; set; }
        }

        public class Handler : IRequestHandler<Command>
        {
            DataContext _dataContext;
            IUserAccessor _userAccessor;

            public Handler(DataContext dataContext, IUserAccessor userAccessor)
            {
                _dataContext = dataContext;
                _userAccessor = userAccessor;
            }

            public async Task<Unit> Handle(Command request, CancellationToken cancellationToken)
            {
                var observer = await _dataContext.Users.SingleOrDefaultAsync(x => x.UserName == _userAccessor.GetCurrentUserName());
                var target = await _dataContext.Users.SingleOrDefaultAsync(x => x.UserName == request.UserName);

                if (target == null)
                    throw new RestException(HttpStatusCode.NotFound, new { User = "Not found" });

                var following = await _dataContext.Followings.SingleOrDefaultAsync(x => x.ObserverId == observer.Id && x.TargetId == target.Id);

                if (following == null)
                    throw new RestException(HttpStatusCode.BadRequest, new { User = "Not following" });

                _dataContext.Remove(following);
                await _dataContext.SaveChangesAsync();

                return Unit.Value;
            }
        }
    }
}