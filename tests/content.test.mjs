import test from "node:test";
import assert from "node:assert/strict";
import {
  allPaths,
  services,
  solutions,
  categories,
  projects,
} from "../lib/content.ts";
test("complete unique route map", () => {
  assert.equal(services.length, 18);
  assert.equal(solutions.length, 15);
  assert.equal(allPaths.length, 43);
  assert.equal(new Set(allPaths).size, 43);
});
test("all internal content relationships resolve", () => {
  for (const c of categories) {
    assert.ok(services.some((s) => s.slug === c.slug));
    for (const l of c.links) assert.ok(services.some((s) => s.slug === l));
  }
  for (const s of services)
    for (const r of s.related) assert.ok(solutions.some((x) => x.slug === r));
  for (const s of solutions)
    for (const r of s.services) assert.ok(services.some((x) => x.slug === r));
  for (const p of projects)
    assert.ok(solutions.some((s) => s.slug === p.solution));
});
test("each detailed offering has distinct meaningful content", () => {
  assert.equal(new Set(services.map((s) => s.intro)).size, 18);
  assert.equal(new Set(solutions.map((s) => s.intro)).size, 15);
  for (const s of services) {
    assert.ok(s.intro.length > 100);
    assert.ok(s.problem.length > 100);
    assert.ok(s.approach.length > 100);
    assert.ok(s.deliverables.length >= 5);
  }
  for (const s of solutions) {
    assert.equal(s.modules.length, 5);
    assert.equal(s.workflow.length, 4);
    assert.ok(s.consideration.length > 100);
  }
});
test("concepts are transparently labeled", () => {
  for (const p of projects) assert.equal(p.status, "Planned concept");
});
