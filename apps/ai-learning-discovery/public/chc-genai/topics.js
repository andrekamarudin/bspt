/* Canonical CHC topics. Live survey lets staff choose one level with topics in its description. The previous matrix is retained only to explain Before on /chc-genai/logic. Original labels are archived for provenance. */
(function(){
"use strict";
const ORIGINAL={
  "beginner": {
    "name": "AI basics",
    "short": "Beginner",
    "topics": [
      "Ask better questions",
      "Draft and edit emails",
      "Write a useful prompt",
      "Check AI answers",
      "Keep personal details private",
      "Turn notes into tasks",
      "Work with voice, images and files",
      "Plan a task or event"
    ]
  },
  "intermediate": {
    "name": "AI at work",
    "short": "Intermediate",
    "topics": [
      "Chatbots and agents",
      "Coding agents",
      "Reports from files",
      "Connect AI to your tools",
      "Reusable AI instructions",
      "Manage access safely",
      "Build a simple tool",
      "Automate routine tasks"
    ]
  },
  "advanced": {
    "name": "AI for teams",
    "short": "Advanced",
    "topics": [
      "Review software costs",
      "Help teams use AI",
      "Work with multiple AI agents",
      "Build reliable AI workflows",
      "Test and recover safely",
      "Improve reporting workflows",
      "Run AI projects efficiently",
      "Measure costs and benefits"
    ]
  }
};
const TRACKS={
  "beginner": {
    "name": "AI basics",
    "short": "Beginner",
    "icon": "🌱",
    "about": "Get a useful result from AI and know when to check, correct or avoid it.",
    "outcomes": [
      "Choose one useful, safe task for AI to help with.",
      "Explain a clear goal and check the output.",
      "Use AI without exposing confidential information."
    ],
    "topics": [
      [
        "chc_b1",
        "🎯",
        "Choose a task worth using AI for",
        "Decide what is useful, low-risk and worth your time."
      ],
      [
        "chc_b2",
        "📝",
        "Give AI a clear job",
        "Say what you need, what to use and what a good result looks like."
      ],
      [
        "chc_b3",
        "📚",
        "Learn with AI, not just get answers",
        "Get explanations, practice and feedback you can understand."
      ],
      [
        "chc_b4",
        "🔎",
        "Know when to trust the result",
        "Check important claims and spot missing information."
      ],
      [
        "chc_b5",
        "🔒",
        "Keep information safe",
        "Decide what must stay out of AI tools."
      ],
      [
        "chc_b6",
        "✅",
        "Turn a draft into something useful",
        "Turn notes into a plan, action list or message, then check it."
      ]
    ]
  },
  "intermediate": {
    "name": "AI at work",
    "short": "Intermediate",
    "icon": "⚡",
    "about": "Design useful AI-assisted work that saves unnecessary handoffs and is easy to check.",
    "outcomes": [
      "Choose worthwhile work to delegate to AI.",
      "Specify the result and proof of completion.",
      "Know when to use chat, tools or agents and when to involve a person."
    ],
    "topics": [
      [
        "chc_i1",
        "🎯",
        "Choose the work worth delegating",
        "Prioritise tasks by time, impact, available data and risk."
      ],
      [
        "chc_i2",
        "✅",
        "Define success AI can prove",
        "Specify the output, acceptance checks and when to escalate."
      ],
      [
        "chc_i3",
        "🤝",
        "Get cross-functional help without waiting",
        "Use AI for good-enough first passes across roles, then involve experts where needed."
      ],
      [
        "chc_i4",
        "📊",
        "Turn files into reliable decisions",
        "Find what matters in documents or data, and show the supporting evidence."
      ],
      [
        "chc_i5",
        "📓",
        "Make good results repeatable",
        "Turn a successful chat into instructions, templates and checks others can use."
      ],
      [
        "chc_i6",
        "🔌",
        "Choose chat, tools or agents",
        "Decide when conversation is enough and when connected actions are justified."
      ],
      [
        "chc_i7",
        "🛡️",
        "Keep humans in control",
        "Set access, approval, failure and exception boundaries."
      ],
      [
        "chc_i8",
        "🛠️",
        "Build a small workflow and prove its value",
        "Prototype a repeat task and test whether it works before scaling."
      ]
    ]
  },
  "advanced": {
    "name": "AI for teams",
    "short": "Advanced",
    "icon": "🚀",
    "about": "Decide which AI initiatives deserve investment and how to run them responsibly.",
    "outcomes": [
      "Prioritise viable initiatives.",
      "Define governance, reliability and ownership.",
      "Measure benefits against total operating effort."
    ],
    "topics": [
      [
        "chc_a1",
        "💡",
        "Choose AI initiatives worth funding",
        "Compare expected value, effort, data readiness and downside."
      ],
      [
        "chc_a2",
        "🧭",
        "Define who decides and approves",
        "Set the boundaries between AI autonomy, human judgment and explicit approval."
      ],
      [
        "chc_a3",
        "🧪",
        "Test reliability before rollout",
        "Use difficult cases, failure recovery and measurable acceptance criteria."
      ],
      [
        "chc_a4",
        "🔗",
        "Connect systems responsibly",
        "Decide what data and permissions AI tools may access."
      ],
      [
        "chc_a5",
        "🏗️",
        "Scale repeatable work across teams",
        "Design common workflows with owners, monitoring and exception handling."
      ],
      [
        "chc_a6",
        "📈",
        "Measure value and ongoing costs",
        "Compare actual outcomes, time, spend and maintenance before expanding."
      ]
    ]
  }
};
const ROW_LABELS=["Rarely or never","Sometimes","Most days"];
const COLUMN_LABELS=["Chat or none","Files and reports","Agents or coding tools"];
const MATRIX=[["beginner","intermediate","intermediate"],["intermediate","intermediate","advanced"],["intermediate","intermediate","advanced"]];
function recommend(experience,capabilities){
 if(!experience)return "intermediate"; // Default when Step 1 skipped, unchanged.
 const r=experience==="daily"?2:experience==="casual"?1:0;
 const c=(capabilities||[]).includes("agents")?2:(capabilities||[]).includes("files")?1:0;
 return MATRIX[r][c];
}
Object.assign(window,{CHC_ORIGINAL:ORIGINAL,CHC_TRACKS:TRACKS,CHC_MATRIX:MATRIX,CHC_ROWS:ROW_LABELS,CHC_COLUMNS:COLUMN_LABELS,CHC_RECOMMEND:recommend});
})();
