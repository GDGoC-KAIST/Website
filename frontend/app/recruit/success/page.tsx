import {useLanguage} from "@/lib/i18n-context";

const TEXT = {
  en: {
    title: "Application Submitted",
    body:
      "Please check your KAIST email for the confirmation message. We will contact you once the review is complete.",
  },
  ko: {
    title: "지원서가 제출되었습니다",
    body: "KAIST 이메일로 발송된 확인 메일을 확인해주세요. 검토가 완료되면 안내 메일을 보내드릴게요.",
  },
};

export default function RecruitSuccessPage() {
  const {language} = useLanguage();
  const copy = TEXT[language];
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <h1 className="text-3xl font-semibold text-gray-900">{copy.title}</h1>
        <p className="mt-4 text-gray-600">{copy.body}</p>
      </div>
    </section>
  );
}
