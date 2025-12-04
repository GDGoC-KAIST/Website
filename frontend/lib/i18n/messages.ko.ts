import {BRAND} from "@/lib/brand";

export const messagesKo = {
  brand: {
    full: BRAND.fullName,
    short: BRAND.shortName,
    hashtag: BRAND.hashtag,
  },
  nav: {
    home: "홈",
    about: "소개",
    projects: "프로젝트",
    seminars: "세미나",
    members: "멤버",
    contact: "문의",
    recruiting: "리크루팅",
    admin: "관리자",
  },
  recruit: {
    status: {
      open: "모집중",
      soon: "오픈 예정",
      closed: "마감",
    },
  },
  hero: {
    main: {
      description:
        "KAIST에서 함께 배우고, 만들고, 공유합니다. 세미나 개최, 실습 프로젝트 운영, 개발자 네트워킹을 지원합니다.",
    },
    about: {
      description:
        "Google for Developers → GDG → GDG on Campus → GDG on Campus KAIST까지 이어지는 흐름과 GDE 프로그램을 한눈에 정리했습니다.",
    },
    members: {
      description:
        "디자이너, 엔지니어, 커뮤니티 오거나이저가 함께 협업하며 GDG on Campus KAIST를 성장시키고 있습니다.",
    },
    projects: {
      description:
        "우리 챕터는 학기마다 실험적인 아이디어와 실제 서비스를 함께 구현합니다. 진행 중인 프로젝트와 완료된 결과물을 확인해 보세요.",
    },
    seminars: {
      description:
        "Google 엔지니어 초청 강연부터 내부 워크숍까지, 기술과 커뮤니티 이야기를 함께 나눕니다.",
    },
  },
  footer: {
    explore: "둘러보기",
    rights: "모든 권리를 보유하고 있습니다.",
    madeWith: "만든 이:",
    by: "by",
    contact: "문의",
    emailLabel: "이메일",
    description:
      "GDG on Campus KAIST는 캠퍼스에서 세미나와 프로젝트를 진행하며 메이커들이 함께 성장하도록 돕습니다.",
    socialHeading: "소셜",
    social: {
      instagram: "인스타그램",
      linkedin: "링크드인",
    },
  },
  seo: {
    title: `${BRAND.shortName} 공식 사이트`,
    description:
      "GDG on Campus KAIST는 캠퍼스에서 최신 기술을 함께 학습하고 프로젝트를 만드는 학생 개발자 커뮤니티입니다.",
  },
  home: {
    hero: {
      description:
        "KAIST에서 함께 배우고 만들며 공유합니다. 세미나, 실습 프로젝트, 커뮤니티 네트워킹을 운영합니다.",
      ctaPrimary: "리크루팅 합류하기",
      ctaSecondary: "프로젝트 보기",
    },
    whatWeDo: {
      description:
        "매 시즌 세미나와 프로젝트, 커뮤니티 프로그램을 직접 설계해 운영합니다.",
      cards: {
        sessions:
          "격주 테크 톡, 라이트닝 데모, 스터디 잼을 멤버와 게스트가 함께 진행합니다.",
        projects:
          "소규모 팀이 학기마다 실제 프로토타입을 출시합니다. 캠퍼스 도구부터 오픈소스까지 다양합니다.",
        community:
          "온보딩 코호트와 멘토링, 소셜 모임으로 신입과 시니어가 함께 성장합니다.",
      },
    },
    activities: {
      description: "세미나, 해커톤, 스티커 스왑, 로드쇼 순간들을 담았습니다.",
    },
    featured: {
      description: "GDGoC 팀이 최근 선보인 실제 데모와 실험들을 확인해 보세요.",
    },
    recruit: {
      description: "세미나와 프로젝트, 커뮤니티 프로그램을 함께할 신입 멤버를 학기마다 모집합니다.",
      ctaPrimaryOpen: "지금 지원하기",
      ctaPrimaryClosed: "모집 안내 보기",
      ctaSecondary: "전형 절차 보기 →",
    },
    contact: {
      subtitle: "캠퍼스 이벤트, 게스트 세션, 공동 프로그램 등 어떤 제안도 환영합니다.",
      cardBody: "메시지를 남겨 주시면 1~2일 내 회신 드립니다. 협업, 초청 세션, 프로젝트 아이디어를 환영합니다.",
      responseTime: "48시간 이내 응답",
      recruitHintPrefix: "리크루팅 현황은",
      recruitHintSuffix: "에서 확인할 수 있습니다.",
      cardPrimaryCta: "문의 폼",
      cardSecondaryCta: "이메일 보내기",
    },
  },
  contact: {
    hero: {
      tag: "문의",
      title: `${BRAND.shortName}에 문의하기`,
      description:
        "세미나 발표, 후원, 공동 프로젝트 등 무엇이든 환영합니다. 아래 폼으로 메시지를 남겨 주세요.",
      primaryCta: "문의 작성하기",
      primaryHelper: "폼으로 이동",
      secondaryLink: "협업 가이드",
    },
    info: {
      emailLabel: "이메일",
      emailHelper: "1~2일 내 회신 드립니다",
      locationLabel: "장소",
      locationValue: "KAIST, 대전",
      locationHelper: "방문 예약 후 찾아주세요",
      socialLabel: "소셜",
      instagramHelper: "일상 활동 엿보기",
      copyLabel: "주소 복사",
      copySuccess: "복사되었습니다!",
      copyFallback: "복사에 실패했습니다. 직접 복사해 주세요.",
      mapLabel: "지도 열기",
    },
    mail: {
      formTitle: "문의하기",
      label: {
        name: "이름",
        replyTo: "회신 이메일",
        category: "문의 유형",
        subject: "제목",
        message: "내용",
      },
      submit: "보내기",
      sending: "보내는 중...",
      note: "※ 전송 시 메일 앱이 열리고 입력 내용이 자동으로 채워집니다.",
      notePrivacy: "모든 정보는 문의 응답 목적에만 사용되며 외부에 공유되지 않습니다.",
      feedback: {
        inline: "메일 앱으로 전송 화면이 열렸습니다. 1~2일 내 회신 드릴게요.",
        toastOpen: "메일 앱을 여는 중입니다.",
        toastFallback: "메일 앱을 열 수 없습니다. 이메일 주소를 직접 복사해 주세요.",
      },
      errors: {
        required: "필수 입력입니다.",
        invalidEmail: "유효한 이메일을 입력하세요.",
        addDetail: "조금 더 자세히 입력해주세요.",
      },
    },
    categories: {
      speaking: "세미나 연사 제안",
      sponsorship: "후원 문의",
      collab: "공동 프로젝트",
      other: "기타",
    },
    secondaryLink: "협업 가이드",
  },
} as const;

export type KoreanMessages = typeof messagesKo;
