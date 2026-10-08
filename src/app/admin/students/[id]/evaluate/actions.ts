"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/db/supabase";

function calcWeighted(scores: (number | null)[], maxRaw: number, weightPct: number): number | null {
  const valid = scores.filter((s): s is number => s !== null && s !== undefined);
  if (valid.length === 0) return null;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return (avg / maxRaw) * weightPct;
}

export async function createOjtEvaluation(formData: {
  studentId: string;
  department: string;
  trainingPeriod: string;
  supervisorName: string;
  evaluationDate: string;
  qualityOfWork: number | null;
  productivityEfficiency: number | null;
  accuracyAttentionToDetail: number | null;
  abilityToFollowInstructions: number | null;
  abilityToWorkIndependently: number | null;
  understandingOfTasks: number | null;
  technicalSkills: number | null;
  problemSolvingSkills: number | null;
  abilityToLearnApplyFeedback: number | null;
  punctualityAttendance: number | null;
  initiative: number | null;
  responsibilityDependability: number | null;
  professionalBehavior: number | null;
  communicationSkills: number | null;
  teamworkCollaboration: number | null;
  customerClientInteraction: number | null;
  comments: string;
  evaluatorSignature: string;
}) {
  const wp = calcWeighted(
    [formData.qualityOfWork, formData.productivityEfficiency, formData.accuracyAttentionToDetail, formData.abilityToFollowInstructions, formData.abilityToWorkIndependently],
    5, 40
  );
  const ks = calcWeighted(
    [formData.understandingOfTasks, formData.technicalSkills, formData.problemSolvingSkills, formData.abilityToLearnApplyFeedback],
    5, 25
  );
  const wa = calcWeighted(
    [formData.punctualityAttendance, formData.initiative, formData.responsibilityDependability, formData.professionalBehavior],
    5, 20
  );
  const ct = calcWeighted(
    [formData.communicationSkills, formData.teamworkCollaboration, formData.customerClientInteraction],
    5, 15
  );

  const total = [wp, ks, wa, ct].filter((s): s is number => s !== null).reduce((a, b) => a + b, 0);

  const { data: evaluation, error } = await supabaseAdmin
    .from("ojt_evaluations")
    .insert({
      student_id: formData.studentId,
      department: formData.department || null,
      training_period: formData.trainingPeriod || null,
      supervisor_name: formData.supervisorName || null,
      evaluation_date: new Date(formData.evaluationDate).toISOString(),
      quality_of_work: formData.qualityOfWork,
      productivity_efficiency: formData.productivityEfficiency,
      accuracy_attention_to_detail: formData.accuracyAttentionToDetail,
      ability_to_follow_instructions: formData.abilityToFollowInstructions,
      ability_to_work_independently: formData.abilityToWorkIndependently,
      understanding_of_tasks: formData.understandingOfTasks,
      technical_skills: formData.technicalSkills,
      problem_solving_skills: formData.problemSolvingSkills,
      ability_to_learn_apply_feedback: formData.abilityToLearnApplyFeedback,
      punctuality_attendance: formData.punctualityAttendance,
      initiative: formData.initiative,
      responsibility_dependability: formData.responsibilityDependability,
      professional_behavior: formData.professionalBehavior,
      communication_skills: formData.communicationSkills,
      teamwork_collaboration: formData.teamworkCollaboration,
      customer_client_interaction: formData.customerClientInteraction,
      work_performance_score: wp,
      knowledge_skills_score: ks,
      work_attitude_score: wa,
      communication_teamwork_score: ct,
      total_score: total,
      comments: formData.comments || null,
      evaluator_signature: formData.evaluatorSignature || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/admin/students/${formData.studentId}`);
  return { success: true, id: evaluation.id };
}
