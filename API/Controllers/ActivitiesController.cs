using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Application.Activities;
using Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class ActivitiesController : BaseController
    {
        [HttpGet]
        public async Task<ActionResult<List<ActivityDto>>> Get(int? limit, int? offset, bool isGoing,
            bool isHost, DateTime? startDate, CancellationToken ct)
        {
            var result = await Mediator.Send(new List.Query(limit, offset, isGoing, isHost, startDate), ct);

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ActivityDto>> Get(Guid id, CancellationToken ct)
        {
            var result = await Mediator.Send(new Details.Query { Id = id }, ct);

            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<Unit>> Create(Create.Command command, CancellationToken ct)
        {
            var result = await Mediator.Send(command, ct);

            return Ok();
        }

        [HttpPut("{id}")]
        [Authorize(Policy = Policies.IsActivityHost)]
        public async Task<ActionResult<Unit>> Edit(Guid id, Edit.Command command, CancellationToken ct)
        {
            command.Id = id;
            var result = await Mediator.Send(command, ct);

            return Ok();
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = Policies.IsActivityHost)]
        public async Task<ActionResult<Unit>> Delete(Guid id, CancellationToken ct)
        {
            var result = await Mediator.Send(new Delete.Command { Id = id }, ct);

            return Ok();
        }

        [HttpPost("{id}/attend")]
        public async Task<ActionResult<Unit>> Attend(Guid id, CancellationToken ct)
        {
            var result = await Mediator.Send(new Attend.Command { Id = id }, ct);

            return Ok();
        }

        [HttpDelete("{id}/unattend")]
        public async Task<ActionResult<Unit>> Unattend(Guid id, CancellationToken ct)
        {
            var result = await Mediator.Send(new Unattend.Command { Id = id }, ct);

            return Ok();
        }
    }
}