using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Application.Activities;
using Domain;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class ActivitiesController : BaseController
    {
        [HttpGet]
        public async Task<ActionResult<List<Activity>>> Get(CancellationToken ct)
        {
            var result = await Mediator.Send(new List.Query(), ct);

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Activity>> Get(Guid id, CancellationToken ct)
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
        public async Task<ActionResult<Unit>> Edit(Guid id, Edit.Command command, CancellationToken ct)
        {
            command.Id = id;
            var result = await Mediator.Send(command, ct);

            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<Unit>> Delete(Guid id, CancellationToken ct)
        {
            var result = await Mediator.Send(new Delete.Command { Id = id }, ct);

            return Ok();
        }
    }
}