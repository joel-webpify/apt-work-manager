export function subjectNeedsLengthWarning(subject: string): boolean {
  return subject.length > 60;
}