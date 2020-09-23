using AutoMapper;
using Domain;

namespace Application.Activities
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Activity, ActivityDto>()
                .ForMember(x => x.Atendees, opts => opts.MapFrom(x => x.UserActivities));

            CreateMap<UserActivity, AtendeeDto>()
                .ForMember(x => x.UserName, opts => opts.MapFrom(x => x.AppUser.UserName))
                .ForMember(x => x.DisplayName, opts => opts.MapFrom(x => x.AppUser.DisplayName));
        }
    }
}