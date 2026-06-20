// ── HR Classification Tests ──
// Verify heuristic classification logic for HR reply types.
// No DOM, no network — pure unit tests on text input.

import { describe, it, expect } from "vitest";
import { classifyHrReply } from "./hr-classification";
import type { ClassificationInput } from "./hr-classification";

describe("classifyHrReply — badge-based classification", () => {
  it("classifies invitation from Russian badge", () => {
    const input: ClassificationInput = {
      text: "Добрый день! Приглашаем вас на следующий этап.",
      statusBadge: "Приглашение",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("invitation");
    expect(result.matchedRules).toContain("badge:invitation");
  });

  it("classifies invitation from English badge", () => {
    const input: ClassificationInput = {
      text: "Hello! We would like to proceed.",
      statusBadge: "Invitation",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("invitation");
    expect(result.matchedRules).toContain("badge:invitation");
  });

  it("classifies rejection from Russian badge", () => {
    const input: ClassificationInput = {
      text: "Благодарим за интерес.",
      statusBadge: "Отказ",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("rejection");
    expect(result.matchedRules).toContain("badge:rejection");
  });

  it("classifies rejection from English badge", () => {
    const input: ClassificationInput = {
      text: "Thank you for your application.",
      statusBadge: "Rejected",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("rejection");
    expect(result.matchedRules).toContain("badge:rejection");
  });

  it("classifies test_task from badge", () => {
    const input: ClassificationInput = {
      text: "Вам направлено тестовое задание.",
      statusBadge: "Тестовое задание",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("test_task");
    expect(result.matchedRules).toContain("badge:test_task");
  });

  it("badge takes priority over content text", () => {
    // Even though text says "вопрос", badge says "Приглашение"
    const input: ClassificationInput = {
      text: "У нас есть несколько вопросов к вам.",
      statusBadge: "Приглашение",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("invitation");
  });
});

describe("classifyHrReply — content-based classification", () => {
  it("classifies test_task from content patterns", () => {
    const input: ClassificationInput = {
      text: "Пожалуйста, выполните тестовое задание до пятницы. Пришлите решение на почту.",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("test_task");
    expect(result.matchedRules).toContain("content:test_task");
  });

  it("classifies invitation from content — приглашаем на собеседование", () => {
    const input: ClassificationInput = {
      text: "Мы рассмотрели ваше резюме и хотим пригласить вас на собеседование.",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("invitation");
    expect(result.matchedRules).toContain("content:invitation");
  });

  it("classifies invitation from content — рады пригласить", () => {
    const input: ClassificationInput = {
      text: "Рады пригласить вас на техническое интервью с командой разработки.",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("invitation");
    expect(result.matchedRules).toContain("content:invitation");
  });

  it("classifies interview details — назначено собеседование", () => {
    const input: ClassificationInput = {
      text: "Напоминаем, что собеседование назначено на 15 июня в 14:00. Собеседование состоится в офисе.",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("interview");
    expect(result.matchedRules).toContain("content:interview");
  });

  it("classifies interview details — подтверждаем собеседование", () => {
    const input: ClassificationInput = {
      text: "Подтверждаем собеседование на завтра. Дата собеседования: 20.06.2026.",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("interview");
    expect(result.matchedRules).toContain("content:interview");
  });

  it("classifies rejection from content — к сожалению", () => {
    const input: ClassificationInput = {
      text: "К сожалению, мы вынуждены отказать вам в дальнейшем рассмотрении.",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("rejection");
    expect(result.matchedRules).toContain("content:rejection");
  });

  it("classifies rejection from content — выбрали другого кандидата", () => {
    const input: ClassificationInput = {
      text: "Благодарим за интерес, но мы решили продолжить с другим кандидатом.",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("rejection");
    expect(result.matchedRules).toContain("content:rejection");
  });

  it("classifies rejection from English content", () => {
    const input: ClassificationInput = {
      text: "Unfortunately, we have decided to move forward with other candidates.",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("rejection");
    expect(result.matchedRules).toContain("content:rejection");
  });

  it("classifies question from content — уточнить", () => {
    const input: ClassificationInput = {
      text: "Хотели бы уточнить ваш опыт работы с Docker и Kubernetes.",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("question");
    expect(result.matchedRules).toContain("content:question");
  });

  it("classifies question from content — не могли бы вы", () => {
    const input: ClassificationInput = {
      text: "Не могли бы вы рассказать подробнее о вашем опыте?",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("question");
    expect(result.matchedRules).toContain("content:question");
  });

  it("classifies question from English content", () => {
    const input: ClassificationInput = {
      text: "Could you please provide more details about your experience with React?",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("question");
  });

  it("returns unknown for unclassifiable content", () => {
    const input: ClassificationInput = {
      text: "Спасибо за ваше резюме.",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("unknown");
    expect(result.matchedRules).toContain("fallback:unknown");
  });
});

describe("classifyHrReply — priority ordering", () => {
  it("invitation takes priority over question in content-based classification", () => {
    // "приглашаем" is checked before "вопрос"
    const input: ClassificationInput = {
      text: "Приглашаем вас на собеседование. Уточните, пожалуйста, удобное время.",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("invitation");
  });

  it("test_task takes priority over invitation in content-based classification", () => {
    const input: ClassificationInput = {
      text: "Приглашаем вас выполнить тестовое задание.",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("test_task");
  });

  it("interview details take priority over question", () => {
    const input: ClassificationInput = {
      text: "Собеседование назначено на пятницу. Подскажите, удобно ли вам это время?",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("interview");
  });
});

describe("classifyHrReply — edge cases", () => {
  it("handles empty text gracefully", () => {
    const input: ClassificationInput = { text: "" };
    const result = classifyHrReply(input);
    expect(result.type).toBe("unknown");
  });

  it("handles whitespace-only text", () => {
    const input: ClassificationInput = { text: "   " };
    const result = classifyHrReply(input);
    expect(result.type).toBe("unknown");
  });

  it("handles null status badge", () => {
    const input: ClassificationInput = {
      text: "Приглашаем на собеседование.",
      statusBadge: null,
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("invitation");
  });

  it("handles undefined status badge", () => {
    const input: ClassificationInput = {
      text: "К сожалению, отказ.",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("rejection");
  });

  it("is case-insensitive for Russian text", () => {
    const input: ClassificationInput = {
      text: "ПРИГЛАШАЕМ НА СОБЕСЕДОВАНИЕ",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("invitation");
  });

  it("is case-insensitive for English text", () => {
    const input: ClassificationInput = {
      text: "UNFORTUNATELY WE MUST REJECT YOUR APPLICATION",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("rejection");
  });

  it("detects invitation from 'приглашение на' prefix", () => {
    const input: ClassificationInput = {
      text: "Приглашение на второй этап отбора.",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("invitation");
  });

  it("detects English invitation", () => {
    const input: ClassificationInput = {
      text: "We would like to invite you for an interview with the team.",
    };
    const result = classifyHrReply(input);
    expect(result.type).toBe("invitation");
  });
});
