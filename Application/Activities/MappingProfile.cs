using System.Linq;
using AutoMapper;
using Domain;

namespace Application.Activities
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Activity, ActivityDto>()
                .ForMember(x => x.Attendees, opts => opts.MapFrom(x => x.UserActivities));

            CreateMap<UserActivity, AtendeeDto>()
                .ForMember(x => x.UserName, opts => opts.MapFrom(x => x.AppUser.UserName))
                .ForMember(x => x.DisplayName, opts => opts.MapFrom(x => x.AppUser.DisplayName))
                .ForMember(x => x.Image, opts => opts.MapFrom(x => x.AppUser.Photos.FirstOrDefault(x => x.IsMain).Url));
        }
    }
}