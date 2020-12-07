using System;

namespace Domain
{
    public class RefreshToken
    {
        public int Id { get; set; }

        public virtual AppUser AppUser { get; set; }

        public string Token { get; set; }

        public DateTime Expires { get; set; }

        public bool IsExpired => DateTime.UtcNow >= Expires;

        public DateTime? Revoked { get; set; }

        public bool IsAvtive => Revoked == null && !IsExpired;

        public RefreshToken()
        {
            Expires = DateTime.UtcNow.AddDays(14);
        }
    }
}