import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase.server";
import ReviewKuisForm from "@/components/public/ReviewKuisForm";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewKuisPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Ambil data attempt siswa beserta profil & kuis
  const { data: attempt, error: attemptError } = await supabase
    .from("student_quiz_attempts")
    .select(`
      id,
      final_score,
      status,
      attempted_at,
      users:student_id ( name, email ),
      quizzes:quiz_id ( title )
    `)
    .eq("id", id)
    .maybeSingle();

  if (attemptError || !attempt) {
    return notFound();
  }

  console.log('student_quz_attempts: ', attempt);

  // Ambil seluruh lembar jawaban siswa yang di-join dengan teks & tipe pertanyaan
  const { data: answers, error: answersError } = await supabase
    .from("student_answers")
    .select(`
      id,
      question_id,
      student_answer_text,
      student_answer_audio_url,
      is_correct,
      score,
      teacher_feedback,
      questions:question_id (
        question_text,
        question_type,
        options,
        correct_answer,
        question_number
      )
    `)
    .eq("attempt_id", id)
    .order("questions(question_number)", { ascending: true });

  if (answersError) {
    return (
      <div className="p-10 text-red-500 font-semibold">
        Gagal memuat lembar jawaban: {answersError.message}
      </div>
    );
  }

  console.log('student_answers: ', answers);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <ReviewKuisForm attempt={attempt as any} initialAnswers={answers as any} />
    </div>
  );
}