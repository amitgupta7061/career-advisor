/**
 * Builds structured prompts for Personalized Learning Roadmap Generation
 */
function buildRoadmapPrompt(role, gaps, student, availableCourses = []) {
  const coursesCatalog = availableCourses.map((c) => ({
    title: c.title,
    platform: c.platform,
    url: c.url,
    skillTags: c.skill_tags || [],
    durationHrs: c.duration_hrs || 20,
    isFree: c.is_free,
  }));

  const systemInstruction = `You are an elite Engineering Curriculum Architect and Technical Career Mentor.
You specialize in designing step-by-step, milestone-driven learning pathways that transform students from their current skill levels into job-ready professionals.
You MUST output ONLY a valid raw JSON object matching the requested schema without markdown formatting or commentary.`;

  const userPrompt = `
TARGET CAREER GOAL:
- Role: ${role.title} (${role.category || "Technology"})
- Overview: ${role.description || ""}

STUDENT'S SKILL STATUS (FROM SKILL GAP ANALYSIS):
- Missing Skills (Need to acquire from scratch): ${JSON.stringify(gaps.missingSkills || [])}
- Improving Skills (Already known, but below required level): ${JSON.stringify(gaps.improvingSkills || [])}
- Mastered / Meeting Skills (Do NOT re-teach basics for these): ${JSON.stringify(gaps.meetingSkills || [])}

VERIFIED AUTHENTIC RESOURCE CATALOG (Use these exact URLs or official platform domains):
${JSON.stringify(coursesCatalog, null, 2)}

INSTRUCTIONS:
1. Design a comprehensive 8 to 12 week personalized curriculum divided into 3 to 4 sequential milestones.
2. Order milestones logically:
   - Milestone 1: Foundational Core & Critical Gaps (must precede advanced tools).
   - Milestone 2: Modern Tooling, Frameworks & Intermediate Integrations.
   - Milestone 3: Production Engineering, Testing & Performance.
   - Milestone 4: End-to-End Industry Capstone Project.
3. Every milestone must contain 2 to 4 actionable activities of types: 'course', 'tutorial', 'project', 'practice', or 'documentation'.
4. For each activity:
   - Link to a real course from the catalog or official documentation (NO fake links).
   - Set realistic duration in hours (e.g. 10 - 40 hrs).
   - List 2-3 specific learning objectives and 1 clear expected outcome.
   - Mark priority as 'critical', 'high', or 'medium'.

OUTPUT JSON SCHEMA:
{
  "roadmapTitle": "Personalized Pathway to ${role.title}",
  "description": "Structured curriculum targeting identified skill gaps and hands-on portfolio projects.",
  "estimatedDurationWeeks": 10,
  "milestones": [
    {
      "milestoneIndex": 1,
      "title": "Phase 1: Core Fundamentals & Primary Gaps",
      "durationWeeks": 3,
      "description": "Master essential prerequisites before entering complex frameworks.",
      "activities": [
        {
          "title": "Mastering Core Fundamentals",
          "description": "Deep-dive into language fundamentals and syntax.",
          "activityType": "course",
          "skillName": "JavaScript",
          "priority": "critical",
          "platform": "freeCodeCamp",
          "resourceUrl": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/",
          "isFree": true,
          "estimatedHrs": 30,
          "learningObjectives": ["Scope, closures, and async patterns", "DOM and browser APIs"],
          "expectedOutcomes": "Ability to write clean asynchronous code without external libraries."
        }
      ]
    }
  ]
}
`;

  return { systemInstruction, userPrompt };
}

/**
 * Deterministic Heuristic Roadmap Generator
 * Provides logical milestone sequencing and authentic catalog pairing with 0% network failure rate
 */
function generateHeuristicRoadmap(role, gaps, student, availableCourses = []) {
  const missing = gaps.missingSkills || [];
  const improving = gaps.improvingSkills || [];
  const allGaps = [...missing, ...improving];

  // Helper to find best matching course from curated DB catalog
  const matchCourse = (skillName) => {
    const s = (skillName || "").toLowerCase().replace(/[\.\s_-]/g, "");
    return (
      availableCourses.find((c) =>
        (c.skill_tags || []).some((tag) => {
          const t = tag.toLowerCase().replace(/[\.\s_-]/g, "");
          return t === s || t.includes(s) || s.includes(t);
        })
      ) || {
        title: `Comprehensive ${skillName} Guide & Practice`,
        platform: "Official Documentation",
        url: "https://developer.mozilla.org/en-US/",
        duration_hrs: 20,
        is_free: true,
      }
    );
  };

  const milestones = [];

  // Milestone 1: Foundational Gaps & Prerequisites
  const phase1Gaps = allGaps.slice(0, 2);
  const phase1Activities = phase1Gaps.map((g, idx) => {
    const course = matchCourse(g.name || g.skill_name);
    return {
      title: `Mastering ${g.name || g.skill_name} Fundamentals`,
      description: `Target high-priority gap: acquire required ${g.requiredLevelLabel || "Advanced"} competency in ${g.name || g.skill_name}.`,
      activityType: "course",
      skillName: g.name || g.skill_name,
      priority: "critical",
      platform: course.platform || "Official Docs",
      resourceUrl: course.url || "https://developer.mozilla.org",
      isFree: course.is_free !== false,
      estimatedHrs: course.duration_hrs || 25,
      learningObjectives: [
        `Understand core principles and runtime execution of ${g.name || g.skill_name}`,
        `Write idiomatic patterns and handle error edge cases`,
      ],
      expectedOutcomes: `Demonstrable foundational competency in ${g.name || g.skill_name} verified through working exercises.`,
    };
  });

  milestones.push({
    milestoneIndex: 1,
    title: "Phase 1: Foundational Competencies & Core Prerequisites",
    durationWeeks: 3,
    description: "Close foundational capability deficits with structured coursework.",
    activities: phase1Activities,
  });

  // Milestone 2: Intermediate Tools, Frameworks & Practice
  const phase2Gaps = allGaps.slice(2, 5);
  const phase2Activities = [];
  phase2Gaps.forEach((g) => {
    const course = matchCourse(g.name || g.skill_name);
    phase2Activities.push({
      title: `Applied Engineering with ${g.name || g.skill_name}`,
      description: `Integrate ${g.name || g.skill_name} into modern application architecture.`,
      activityType: "tutorial",
      skillName: g.name || g.skill_name,
      priority: "high",
      platform: course.platform,
      resourceUrl: course.url,
      isFree: course.is_free !== false,
      estimatedHrs: course.duration_hrs || 20,
      learningObjectives: [
        `Integrate ${g.name || g.skill_name} into multi-tier applications`,
        `Follow industry conventions and modular design principles`,
      ],
      expectedOutcomes: `Completed integration module showcasing ${g.name || g.skill_name} interoperability.`,
    });
  });

  // Add a practical assignment in Phase 2
  if (phase1Gaps.length > 0) {
    const leadSkill = phase1Gaps[0].name || phase1Gaps[0].skill_name;
    phase2Activities.push({
      title: `Hands-on Integration Project: ${leadSkill} Service`,
      description: `Build and deploy a standalone microservice exercising ${leadSkill} best practices.`,
      activityType: "project",
      skillName: leadSkill,
      priority: "high",
      platform: "GitHub Practice Lab",
      resourceUrl: "https://github.com",
      isFree: true,
      estimatedHrs: 15,
      learningObjectives: [
        `Design modular architecture with database persistence`,
        `Write automated unit tests and API validation`,
      ],
      expectedOutcomes: `Published public GitHub repository with comprehensive README and automated test passing.`,
    });
  }

  milestones.push({
    milestoneIndex: 2,
    title: "Phase 2: Framework Integration & Practical Application",
    durationWeeks: 3,
    description: "Combine core foundations with modern tooling and hands-on modules.",
    activities: phase2Activities,
  });

  // Milestone 3: Production Capstone & Portfolio Readiness
  const capstoneSkill = role.title;
  const phase3Activities = [
    {
      title: `Production Deployment, CI/CD & Cloud Infrastructure`,
      description: `Containerize and deploy your services to scalable cloud environments with monitoring.`,
      activityType: "documentation",
      skillName: "DevOps",
      priority: "medium",
      platform: "Docker / Cloud Docs",
      resourceUrl: "https://docs.docker.com/get-started/",
      isFree: true,
      estimatedHrs: 20,
      learningObjectives: [
        `Containerize application using multi-stage Dockerfiles`,
        `Automate CI/CD pipelines for testing and deployment`,
      ],
      expectedOutcomes: `Live deployed application running on cloud container infrastructure.`,
    },
    {
      title: `End-to-End Capstone Project: ${capstoneSkill} Showcase`,
      description: `Design and deliver an industry-grade portfolio capstone project validating all bridge competencies for ${role.title}.`,
      activityType: "project",
      skillName: capstoneSkill,
      priority: "critical",
      platform: "Portfolio Showcase",
      resourceUrl: "https://github.com",
      isFree: true,
      estimatedHrs: 35,
      learningObjectives: [
        `Implement full-stack system architecture addressing real-world problem statements`,
        `Incorporate security, error boundaries, responsive UX, and database transactions`,
      ],
      expectedOutcomes: `Production-ready capstone project ready for technical interview demonstrations.`,
    },
  ];

  milestones.push({
    milestoneIndex: 3,
    title: "Phase 3: Production Architecture & Capstone Portfolio",
    durationWeeks: 4,
    description: "Demonstrate job readiness with a full-stack, tested, and deployed capstone project.",
    activities: phase3Activities,
  });

  return {
    roadmapTitle: `Personalized Pathway to ${role.title}`,
    description: `Targeted 10-week curriculum designed to bridge your specific skill gaps and build a standout portfolio for ${role.title}.`,
    estimatedDurationWeeks: 10,
    milestones,
  };
}

module.exports = {
  buildRoadmapPrompt,
  generateHeuristicRoadmap,
};

