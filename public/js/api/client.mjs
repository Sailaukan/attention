async function readJson(response, fallbackMessage) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || fallbackMessage);
  }

  return data;
}

async function postJson(url, payload, fallbackMessage) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return await readJson(response, fallbackMessage);
}

export async function getRuntimeConfig() {
  const response = await fetch('/api/runtime-config');
  return await readJson(response, 'Runtime config request failed.');
}

export async function requestAttentionSwitchProposal(payload) {
  const data = await postJson('/api/llm/propose-switch', payload, 'LLM reassignment proposal failed.');
  return data.proposal;
}

export async function requestPromptTaskProposal(payload) {
  const data = await postJson('/api/llm/generate-task', payload, 'Prompt-based task generation failed.');
  return data.proposal;
}
