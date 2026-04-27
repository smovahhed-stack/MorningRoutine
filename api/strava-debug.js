module.exports = async function handler(req, res) {
  const { access_token } = req.query;
  
  if (!access_token) {
    return res.json({ error: 'No access token provided' });
  }

  const activitiesRes = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=20',
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  const activities = await activitiesRes.json();
  res.json(activities.map(a => ({ name: a.name, type: a.type, date: a.start_date })));
}