const path = `https://${process.env.VUE_APP_PEER_SERVER_HOST}:${process.env.VUE_APP_PEER_SERVER_PORT}${process.env.VUE_APP_PEER_SERVER_PATH}/${process.env.VUE_APP_PEER_SERVER_KEY}`;

export default async function(): Promise<Array<string>> {
  const response = await fetch(`${path}/peers/`, {
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) throw new Error(await response.text());

  return await response.json();
}