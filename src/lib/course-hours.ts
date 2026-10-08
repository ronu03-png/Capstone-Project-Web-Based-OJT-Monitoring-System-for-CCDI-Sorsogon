export function getRequiredHoursByCourse(course: string): number {
  const normalized = course.trim().toUpperCase();

  const twoYearCourses = [
    "ACT",
    "ASCT",
    "ASSOCIATE",
    "2-YEAR",
    "2 YEAR",
  ];

  const diplomaCourses = [
    "DIP",
    "DIPLOMA",
    "DIT",
  ];

  if (twoYearCourses.some((c) => normalized.includes(c))) return 300;
  if (diplomaCourses.some((c) => normalized.includes(c))) return 400;

  // Default to 500 for standard 4-year courses (BSIT, BSIS, BSCS, etc.)
  return 500;
}
