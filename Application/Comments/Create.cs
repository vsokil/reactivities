using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Application.Errors;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Comments
{
    public class Create
    {
        public class Command : IRequest<CommentDto>
        {
            public string Body { get; set; }

            public Guid ActivityId { get; set; }

            public string UserName { get; set; }
        }

        public class Handler : IRequestHandler<Command, CommentDto>
        {
            DataContext _dataContext;
            IMapper _mapper;

            public Handler(DataContext dataContext, IMapper mapper)
            {
                _dataContext = dataContext;
                _mapper = mapper;
            }

            public async Task<CommentDto> Handle(Command request, CancellationToken cancellationToken)
            {
                var activity = await _dataContext.Activities.FindAsync(request.ActivityId);

                if (activity == null)
                    throw new RestException(HttpStatusCode.NotFound, new { Activity = "Not found" });

                var user = await _dataContext.Users.SingleOrDefaultAsync(x => x.UserName == request.UserName);

                var comment = new Comment
                {
                    Author = user,
                    Activity = activity,
                    Body = request.Body,
                    CreatedAt = DateTime.UtcNow
                };

                activity.Comments.Add(comment);
                await _dataContext.SaveChangesAsync();

                return _mapper.Map<CommentDto>(comment);
            }
        }
    }
}