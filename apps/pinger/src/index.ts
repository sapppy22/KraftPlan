export default {
  async scheduled(_controller: ScheduledController, env: Env, _ctx: ExecutionContext) {
    const url = env.RENDER_API_URL;
    if (!url) {
      console.log('RENDER_API_URL not set — skipping ping');
      return;
    }

    const healthUrl = `${url.replace(/\/+$/, '')}/health`;
    console.log(`Pinging Render backend: ${healthUrl}`);

    try {
      const resp = await fetch(healthUrl, { method: 'GET', signal: AbortSignal.timeout(30000) });
      if (resp.ok) {
        const body = await resp.text();
        console.log(`Ping OK (${resp.status}): ${body.slice(0, 200)}`);
      } else {
        console.warn(`Ping returned ${resp.status} ${resp.statusText}`);
      }
    } catch (err) {
      console.error(`Ping failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  async fetch(_request: Request, _env: Env, _ctx: ExecutionContext) {
    return new Response('Pinger worker is running. Cron triggers handle the pings.', { status: 200 });
  },
} satisfies ExportedHandler<Env>;
