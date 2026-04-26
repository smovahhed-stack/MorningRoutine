module.exports = async function handler(req, res) {
  const { code } = req.query;
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  const activitiesRes = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=20',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const activities = await activitiesRes.json();
  const runs = activities.filter(a => a.type === 'Run').length;
  const lifts = activities.filter(a => a.type === 'WeightTraining').length;

  res.redirect(`/?runs=${runs}&lifts=${lifts}&connected=true`);
}