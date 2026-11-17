export const TOOL_PROMPTS = {
  debrief: {
    label: 'Session Debrief',
    description: 'Turn rough work notes into a clear summary and next actions.',
    instruction: `Review the maker context and notes. Return:

1. What was accomplished
2. What changed
3. What worked
4. What failed or remains unclear
5. The single most important next action
6. 3-6 concrete follow-up tasks

After the readable summary, append exactly one fenced JSON code block containing every proposed task:

\`\`\`json
{
  "proposedActions": [
    {
      "title": "Task title",
      "notes": "Why this matters",
      "priority": "medium"
    }
  ]
}
\`\`\`

Rules:
- Use valid JSON only.
- Do not number the JSON items.
- Do not put commas after the final array item.
- Do not include commentary inside the JSON block.
- Do not invent facts.
- Be concise and practical.`
  },
  diagnose: {
    label: 'Debug Assistant',
    description: 'Analyze symptoms, changes, and test history.',
    instruction: `Act as a careful hardware/software debugging partner. Review the symptoms, recent changes, build details, and test logs.

Return:
1. Most likely causes, ranked
2. Evidence for and against each cause
3. A safe diagnostic sequence
4. Specific measurements or checks to perform
5. What result would confirm or rule out each cause

After the readable diagnosis, append exactly one fenced JSON code block containing proposed diagnostic tasks:

\`\`\`json
{
  "proposedActions": [
    {
      "title": "Measure 3.3V rail under load",
      "notes": "Check for voltage sag while the display and audio circuit are active.",
      "priority": "high"
    }
  ]
}
\`\`\`

Rules:
- Use valid JSON only.
- Do not number the JSON items.
- Do not put commas after the final array item.
- Do not assume facts that are not provided.
- Prioritize safety and reversible tests.`
  },
  plan: {
    label: 'Project Planner',
    description: 'Turn an idea or goal into an actionable build plan.',
    instruction: `Create a practical first build plan. Return:

1. Clear objective
2. Minimum viable outcome
3. Milestones
4. Required parts, tools, or skills
5. Key risks and unknowns
6. First experiment
7. 5-8 actionable starter tasks

After the readable plan, append exactly one fenced JSON code block containing every starter task:

\`\`\`json
{
  "proposedActions": [
    {
      "title": "Research microcontroller options",
      "notes": "Compare ESP32, Raspberry Pi Pico, and other suitable boards for offline music playback and touchscreen control.",
      "priority": "high"
    }
  ]
}
\`\`\`

Rules:
- Use valid JSON only.
- Each proposed action must be a separate object inside the proposedActions array.
- Do not number the JSON items.
- Do not put commas after the final array item.
- Do not include commentary inside the JSON block.
- Keep the plan small enough to begin today.`
  },
  unblock: {
    label: 'Task Unblocker',
    description: 'Break a stuck task into concrete next actions.',
    instruction: `The user is stuck on a task. Identify the real blocker, then provide 3-7 specific, low-friction next actions. Include what to prepare, what to test, and how to know the task is complete.

After the readable response, append exactly one fenced JSON code block:

\`\`\`json
{
  "proposedActions": [
    {
      "title": "Next action",
      "notes": "Details",
      "priority": "medium"
    }
  ]
}
\`\`\`

Rules:
- Use valid JSON only.
- Do not number the JSON items.
- Do not put commas after the final array item.`
  },
  research: {
    label: 'Research Synthesizer',
    description: 'Extract decisions, constraints, and questions from references.',
    instruction: `Review the provided references and notes. Return:

1. Key findings
2. Practical constraints
3. Decisions this supports
4. Open questions
5. Recommended next action

Distinguish facts from interpretation.

If useful actions emerge, append exactly one fenced JSON code block:

\`\`\`json
{
  "proposedActions": [
    {
      "title": "Recommended action",
      "notes": "Details",
      "priority": "medium"
    }
  ]
}
\`\`\`

Rules:
- Use valid JSON only.
- Do not number the JSON items.
- Do not put commas after the final array item.`
  }
};
