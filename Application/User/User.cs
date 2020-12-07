using System.Linq;
using Application.Interfaces;
using Domain;
using Newtonsoft.Json;

namespace Application.User
{
    public class User
    {
        public User(AppUser appUser, IJwtGenerator jwtGenerator, string refreshToken)
        {
            this.DisplayName = appUser.DisplayName;
            this.Token = jwtGenerator.CreateToken(appUser);
            this.UserName = appUser.UserName;
            this.Image = appUser.Photos.FirstOrDefault(x => x.IsMain)?.Url;
            RefreshToken = refreshToken;

        }
        public string DisplayName { get; set; }

        public string Token { get; set; }

        [JsonIgnore]
        public string RefreshToken { get; set; }

        public string UserName { get; set; }

        public string Image { get; set; }
    }
}