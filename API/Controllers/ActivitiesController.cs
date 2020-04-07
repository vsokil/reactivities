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
    [Route("api/[controller]")]
    [ApiController]
    public class ActivitiesController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ActivitiesController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<Activity>>> Get(CancellationToken ct)
        {
            var result = await _mediator.Send(new List.Query(), ct);

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Activity>> Get(Guid id, CancellationToken ct)
        {
            var result = await _mediator.Send(new Details.Query { Id = id }, ct);

            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<Unit>> Create(Create.Command command, CancellationToken ct)
        {
            var result = await _mediator.Send(command, ct);

            return Ok();
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Unit>> Edit(Guid id, Edit.Command command, CancellationToken ct)
        {
            command.Id = id;
            var result = await _mediator.Send(command, ct);

            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<Unit>> Delete(Guid id, CancellationToken ct)
        {
            var result = await _mediator.Send(new Delete.Command { Id = id }, ct);

            return Ok();
        }
    }
}