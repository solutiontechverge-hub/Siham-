import assert from "node:assert/strict";
import {
  buildTeamBusinessServiceRefs,
  isNestedTeamSubservice,
  setTeamMemberCategoryServices,
  createEmptyTeamMemberFormDraft,
} from "./businessTeamMemberModal.data";

{
  const allIds = new Set(["svc-a", "svc-b", "nested-1"]);
  assert.equal(
    isNestedTeamSubservice({ id: "nested-1", parentServiceId: "svc-a" }, allIds),
    true,
  );
  assert.equal(
    isNestedTeamSubservice({ id: "svc-a", parentServiceId: "" }, allIds),
    false,
  );
  assert.equal(
    isNestedTeamSubservice(
      { id: "svc-b", parentServiceId: "main-1-hydrated" },
      allIds,
    ),
    false,
  );
}

{
  const refs = buildTeamBusinessServiceRefs([
    {
      id: "svc-a",
      serviceId: "sid-a",
      categoryId: "cat-1",
      name: "Cut",
      parentServiceId: "",
    },
    {
      id: "nested-1",
      serviceId: "sid-nested",
      categoryId: "cat-1",
      name: "Nested cut",
      parentServiceId: "svc-a",
    },
  ]);
  assert.deepEqual(
    refs.map((r) => r.serviceId),
    ["sid-a"],
  );
}

{
  const draft = setTeamMemberCategoryServices(
    {
      ...createEmptyTeamMemberFormDraft(),
      categoryId: "cat-1",
    },
    "cat-1",
    ["s1", "s2"],
    [{ id: "cat-1", title: "Hair" }],
    {
      businessServices: [
        { serviceId: "s1", categoryId: "cat-1", label: "One" },
        { serviceId: "s2", categoryId: "cat-1", label: "Two" },
      ],
    },
  );
  assert.equal(draft.selectedGroups.length, 1);
  assert.deepEqual(draft.selectedGroups[0]?.subServiceIds, ["s1", "s2"]);
}

console.log("businessTeamMemberModal.data.test.ts: ok");
