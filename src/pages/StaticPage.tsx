import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import { Helmet } from 'react-helmet-async';

const pageContent = {
  about: {
    en: {
      title: 'About Us',
      content: `Welcome to ECHO NEWS. We are a leading digital news platform dedicated to providing accurate, timely, and comprehensive coverage of global events. Our mission is to empower our readers with the information they need to understand the world around them.\n\nFounded in 2026, ECHO NEWS has grown to become a trusted source for breaking news, in-depth analysis, and diverse perspectives across politics, business, technology, science, health, and sports.\n\nOur team of experienced journalists and editors is committed to the highest standards of journalistic integrity, objectivity, and independence. We believe in the power of journalism to hold power accountable, foster informed public discourse, and drive positive change.`
    },
    ar: {
      title: 'من نحن',
      content: `مرحباً بكم في إيكو نيوز (ECHO NEWS). نحن منصة إخبارية رقمية رائدة مكرسة لتقديم تغطية دقيقة وفي الوقت المناسب وشاملة للأحداث العالمية. مهمتنا هي تمكين قرائنا بالمعلومات التي يحتاجونها لفهم العالم من حولهم.\n\nتأسست إيكو نيوز في عام 2026، ونمت لتصبح مصدراً موثوقاً للأخبار العاجلة والتحليلات المتعمقة ووجهات النظر المتنوعة عبر السياسة والأعمال والتكنولوجيا والعلوم والصحة والرياضة.\n\nيلتزم فريقنا من الصحفيين والمحررين ذوي الخبرة بأعلى معايير النزاهة الصحفية والموضوعية والاستقلالية. نحن نؤمن بقوة الصحافة في مساءلة السلطة، وتعزيز الخطاب العام المستنير، وإحداث تغيير إيجابي.`
    }
  },
  terms: {
    en: {
      title: 'Terms and Conditions',
      content: `These Terms and Conditions govern your use of the ECHO NEWS website and services. By accessing or using our platform, you agree to be bound by these terms.\n\n1. Use of Content\nAll content on ECHO NEWS, including text, images, videos, and graphics, is protected by copyright and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our prior written consent.\n\n2. User Conduct\nYou agree to use our platform for lawful purposes only. You may not engage in any activity that disrupts or interferes with the functioning of the website or the experience of other users.\n\n3. Disclaimer of Warranties\nECHO NEWS provides its content on an "as is" and "as available" basis. We make no warranties, express or implied, regarding the accuracy, completeness, or reliability of the information provided.\n\n4. Limitation of Liability\nECHO NEWS shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising out of your use of or inability to use our platform.\n\n5. Changes to Terms\nWe reserve the right to modify these Terms and Conditions at any time. Your continued use of the platform after any changes constitutes your acceptance of the revised terms.`
    },
    ar: {
      title: 'الأحكام والشروط',
      content: `تحكم هذه الأحكام والشروط استخدامك لموقع وخدمات إيكو نيوز. من خلال الوصول إلى منصتنا أو استخدامها، فإنك توافق على الالتزام بهذه الشروط.\n\n1. استخدام المحتوى\nجميع المحتويات الموجودة على إيكو نيوز، بما في ذلك النصوص والصور ومقاطع الفيديو والرسومات، محمية بموجب حقوق الطبع والنشر وقوانين الملكية الفكرية الأخرى. لا يجوز لك إعادة إنتاج أو توزيع أو تعديل أو إنشاء أعمال مشتقة دون موافقتنا الخطية المسبقة.\n\n2. سلوك المستخدم\nأنت توافق على استخدام منصتنا لأغراض قانونية فقط. لا يجوز لك الانخراط في أي نشاط يعطل أو يتداخل مع عمل الموقع أو تجربة المستخدمين الآخرين.\n\n3. إخلاء المسؤولية عن الضمانات\nتقدم إيكو نيوز محتواها على أساس "كما هو" و"كما هو متاح". نحن لا نقدم أي ضمانات، صريحة أو ضمنية، فيما يتعلق بدقة أو اكتمال أو موثوقية المعلومات المقدمة.\n\n4. حدود المسؤولية\nلن تكون إيكو نيوز مسؤولة عن أي أضرار مباشرة أو غير مباشرة أو عرضية أو تبعية أو تأديبية تنشأ عن استخدامك أو عدم قدرتك على استخدام منصتنا.\n\n5. التغييرات على الشروط\nنحتفظ بالحق في تعديل هذه الأحكام والشروط في أي وقت. استمرارك في استخدام المنصة بعد أي تغييرات يشكل قبولك للشروط المعدلة.`
    }
  },
  privacy: {
    en: {
      title: 'Privacy Policy',
      content: `At ECHO NEWS, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your personal information.\n\n1. Information We Collect\nWe may collect personal information such as your name, email address, and location when you subscribe to our newsletter, create an account, or interact with our platform. We also collect non-personal information such as your IP address, browser type, and device information through cookies and similar technologies.\n\n2. How We Use Your Information\nWe use your information to provide and improve our services, personalize your experience, communicate with you, and analyze site traffic and usage patterns.\n\n3. Information Sharing\nWe do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our website and conducting our business, subject to strict confidentiality agreements.\n\n4. Data Security\nWe implement reasonable security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction.\n\n5. Your Rights\nYou have the right to access, correct, or delete your personal information. You may also opt out of receiving promotional communications from us at any time.\n\n6. Changes to Privacy Policy\nWe may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the revised policy on our website.`
    },
    ar: {
      title: 'سياسة الخصوصية',
      content: `في إيكو نيوز، نحن ملتزمون بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيف نقوم بجمع معلوماتك الشخصية واستخدامها وحمايتها.\n\n1. المعلومات التي نجمعها\nقد نجمع معلومات شخصية مثل اسمك وعنوان بريدك الإلكتروني وموقعك عندما تشترك في النشرة الإخبارية أو تنشئ حساباً أو تتفاعل مع منصتنا. نقوم أيضاً بجمع معلومات غير شخصية مثل عنوان IP الخاص بك ونوع المتصفح ومعلومات الجهاز من خلال ملفات تعريف الارتباط والتقنيات المشابهة.\n\n2. كيف نستخدم معلوماتك\nنستخدم معلوماتك لتقديم خدماتنا وتحسينها، وتخصيص تجربتك، والتواصل معك، وتحليل حركة مرور الموقع وأنماط الاستخدام.\n\n3. مشاركة المعلومات\nنحن لا نبيع أو نتاجر أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك مع مزودي الخدمة الموثوق بهم الذين يساعدوننا في تشغيل موقعنا وإدارة أعمالنا، مع مراعاة اتفاقيات السرية الصارمة.\n\n4. أمن البيانات\nنحن ننفذ تدابير أمنية معقولة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو الكشف عنها أو تغييرها أو تدميرها.\n\n5. حقوقك\nلديك الحق في الوصول إلى معلوماتك الشخصية أو تصحيحها أو حذفها. يمكنك أيضاً إلغاء الاشتراك في تلقي الاتصالات الترويجية منا في أي وقت.\n\n6. التغييرات على سياسة الخصوصية\nقد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنقوم بإخطارك بأي تغييرات مهمة عن طريق نشر السياسة المعدلة على موقعنا.`
    }
  },
  cookies: {
    en: {
      title: 'Cookie Policy & Preferences',
      content: `ECHO NEWS uses cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and personalize content and advertisements.\n\nWhat are cookies?\nCookies are small text files that are stored on your device when you visit a website. They help the website remember your actions and preferences over a period of time, so you don't have to keep re-entering them whenever you come back to the site or browse from one page to another.\n\nTypes of cookies we use:\n- Essential Cookies: These are necessary for the website to function properly and cannot be switched off in our systems.\n- Performance Cookies: These allow us to count visits and traffic sources so we can measure and improve the performance of our site.\n- Functional Cookies: These enable the website to provide enhanced functionality and personalization.\n- Targeting Cookies: These may be set through our site by our advertising partners to build a profile of your interests and show you relevant adverts on other sites.\n\nManaging your cookie preferences:\nYou can manage your cookie preferences through your browser settings. Most browsers allow you to block or delete cookies. However, please note that if you disable cookies, some features of our website may not function properly.\n\nBy continuing to use ECHO NEWS, you consent to our use of cookies in accordance with this policy.`
    },
    ar: {
      title: 'سياسة وتفضيلات ملفات تعريف الارتباط',
      content: `تستخدم إيكو نيوز ملفات تعريف الارتباط وتقنيات التتبع المشابهة لتعزيز تجربة التصفح الخاصة بك، وتحليل حركة مرور الموقع، وتخصيص المحتوى والإعلانات.\n\nما هي ملفات تعريف الارتباط؟\nملفات تعريف الارتباط هي ملفات نصية صغيرة يتم تخزينها على جهازك عندما تزور موقعاً إلكترونياً. إنها تساعد الموقع على تذكر أفعالك وتفضيلاتك على مدار فترة زمنية، لذلك لا تضطر إلى الاستمرار في إعادة إدخالها كلما عدت إلى الموقع أو تصفحت من صفحة إلى أخرى.\n\nأنواع ملفات تعريف الارتباط التي نستخدمها:\n- ملفات تعريف الارتباط الأساسية: هذه ضرورية لعمل الموقع بشكل صحيح ولا يمكن إيقاف تشغيلها في أنظمتنا.\n- ملفات تعريف الارتباط الخاصة بالأداء: تسمح لنا بحساب الزيارات ومصادر حركة المرور حتى نتمكن من قياس أداء موقعنا وتحسينه.\n- ملفات تعريف الارتباط الوظيفية: تمكن الموقع من توفير وظائف وتخصيص محسّن.\n- ملفات تعريف الارتباط الاستهدافية: قد يتم تعيينها من خلال موقعنا بواسطة شركائنا في الإعلانات لإنشاء ملف تعريف لاهتماماتك وإظهار إعلانات ذات صلة لك على مواقع أخرى.\n\nإدارة تفضيلات ملفات تعريف الارتباط الخاصة بك:\nيمكنك إدارة تفضيلات ملفات تعريف الارتباط الخاصة بك من خلال إعدادات المتصفح الخاص بك. تسمح لك معظم المتصفحات بحظر أو حذف ملفات تعريف الارتباط. ومع ذلك، يرجى ملاحظة أنه إذا قمت بتعطيل ملفات تعريف الارتباط، فقد لا تعمل بعض ميزات موقعنا بشكل صحيح.\n\nمن خلال الاستمرار في استخدام إيكو نيوز، فإنك توافق على استخدامنا لملفات تعريف الارتباط وفقاً لهذه السياسة.`
    }
  },
  accessibility: {
    en: {
      title: 'Accessibility Statement',
      content: `ECHO NEWS is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.\n\nMeasures to support accessibility:\n- We include accessibility throughout our internal policies.\n- We integrate accessibility into our procurement practices.\n- We provide continual accessibility training for our staff.\n- We assign clear accessibility goals and responsibilities.\n\nConformance status:\nThe Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. ECHO NEWS is partially conformant with WCAG 2.1 level AA. Partially conformant means that some parts of the content do not fully conform to the accessibility standard.\n\nFeedback:\nWe welcome your feedback on the accessibility of ECHO NEWS. Please let us know if you encounter accessibility barriers on our platform by contacting our support team.`
    },
    ar: {
      title: 'بيان إمكانية الوصول',
      content: `تلتزم إيكو نيوز بضمان إمكانية الوصول الرقمي للأشخاص ذوي الإعاقة. نحن نعمل باستمرار على تحسين تجربة المستخدم للجميع وتطبيق معايير إمكانية الوصول ذات الصلة.\n\nالتدابير لدعم إمكانية الوصول:\n- نقوم بتضمين إمكانية الوصول في جميع سياساتنا الداخلية.\n- ندمج إمكانية الوصول في ممارسات المشتريات الخاصة بنا.\n- نقدم تدريباً مستمراً على إمكانية الوصول لموظفينا.\n- نحدد أهدافاً ومسؤوليات واضحة لإمكانية الوصول.\n\nحالة المطابقة:\nتحدد إرشادات إمكانية الوصول إلى محتوى الويب (WCAG) متطلبات المصممين والمطورين لتحسين إمكانية الوصول للأشخاص ذوي الإعاقة. وتحدد ثلاثة مستويات من المطابقة: المستوى A، والمستوى AA، والمستوى AAA. إيكو نيوز متوافقة جزئياً مع WCAG 2.1 المستوى AA. متوافق جزئياً يعني أن بعض أجزاء المحتوى لا تتوافق تماماً مع معيار إمكانية الوصول.\n\nالتعليقات:\nنرحب بتعليقاتك حول إمكانية الوصول إلى إيكو نيوز. يرجى إعلامنا إذا واجهت حواجز إمكانية الوصول على منصتنا عن طريق الاتصال بفريق الدعم لدينا.`
    }
  },
  sitemap: {
    en: {
      title: 'Sitemap',
      content: `Navigate through ECHO NEWS using our sitemap below:\n\nMain Sections:\n- [Home](/)\n- [World News](/category/world)\n- [Business](/category/business)\n- [Technology](/category/technology)\n- [Science](/category/science)\n- [Health](/category/health)\n- [Sports](/category/sports)\n\nInformation:\n- [About Us](/page/about)\n- [Newsletters](/page/newsletters)\n\nLegal & Help:\n- [Terms and Conditions](/page/terms)\n- [Privacy Policy](/page/privacy)\n- [Cookie Policy](/page/cookies)\n- [Accessibility Statement](/page/accessibility)`
    },
    ar: {
      title: 'خريطة الموقع',
      content: `تصفح إيكو نيوز باستخدام خريطة الموقع أدناه:\n\nالأقسام الرئيسية:\n- [الرئيسية](/)\n- [أخبار العالم](/category/world)\n- [أعمال](/category/business)\n- [تكنولوجيا](/category/technology)\n- [علوم](/category/science)\n- [صحة](/category/health)\n- [رياضة](/category/sports)\n\nمعلومات:\n- [من نحن](/page/about)\n- [النشرات البريدية](/page/newsletters)\n\nقانوني ومساعدة:\n- [الأحكام والشروط](/page/terms)\n- [سياسة الخصوصية](/page/privacy)\n- [سياسة ملفات تعريف الارتباط](/page/cookies)\n- [بيان إمكانية الوصول](/page/accessibility)`
    }
  },
  newsletters: {
    en: {
      title: 'Newsletters',
      content: `Stay informed with ECHO NEWS newsletters delivered straight to your inbox. Choose from our daily briefings or weekly deep-dives into specific topics.\n\nAvailable Newsletters:\n- The Daily Echo: Your morning briefing on the top global stories. Delivered daily at 6 AM.\n- Tech Insights: Weekly analysis of the biggest trends in technology and innovation. Delivered every Wednesday.\n- Market Watch: Essential business and financial news, delivered every Friday afternoon.\n- Health & Science Weekly: Discoveries, medical news, and wellness tips. Delivered every Sunday.\n\nHow to Subscribe:\nTo subscribe, simply enter your email address in the newsletter subscription form located at the bottom of our homepage. You will receive a confirmation email shortly after. You can opt-out at any time by clicking the unsubscribe link at the bottom of any of our emails.`
    },
    ar: {
      title: 'النشرات البريدية',
      content: `ابق على اطلاع دائم مع النشرات البريدية لإيكو نيوز التي تصل مباشرة إلى صندوق الوارد الخاص بك. اختر من بين إحاطاتنا اليومية أو تحليلاتنا الأسبوعية المتعمقة في مواضيع محددة.\n\nالنشرات المتاحة:\n- صدى اليوم (The Daily Echo): إحاطتك الصباحية لأهم القصص العالمية. تصلك يومياً في السادسة صباحاً.\n- رؤى تقنية (Tech Insights): تحليل أسبوعي لأكبر الاتجاهات في التكنولوجيا والابتكار. تصلك كل أربعاء.\n- مراقب السوق (Market Watch): أخبار الأعمال والمال الأساسية، تصلك كل يوم جمعة مساءً.\n- أسبوع الصحة والعلوم: الاكتشافات والأخبار الطبية ونصائح العافية. تصلك كل أحد.\n\nكيفية الاشتراك:\nللاشتراك، ما عليك سوى إدخال عنوان بريدك الإلكتروني في نموذج الاشتراك في النشرة البريدية الموجود أسفل صفحتنا الرئيسية. ستتلقى رسالة تأكيد عبر البريد الإلكتروني بعد فترة وجيزة. يمكنك إلغاء الاشتراك في أي وقت عن طريق النقر على رابط إلغاء الاشتراك الموجود أسفل أي من رسائل البريد الإلكتروني الخاصة بنا.`
    }
  }
};

export default function StaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const pageData = pageContent[slug as keyof typeof pageContent];

  if (!pageData) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          {language === 'en' ? 'Page Not Found' : 'الصفحة غير موجودة'}
        </h1>
        <Link to="/" className="text-primary hover:underline">
          {language === 'en' ? 'Return to Home' : 'العودة للرئيسية'}
        </Link>
      </div>
    );
  }

  const data = pageData[language as 'en' | 'ar'];
  
  const siteName = import.meta.env.VITE_SITE_NAME || 'ECHO NEWS';
  const pageTitle = `${data.title} | ${siteName}`;
  const pageDesc = language === 'en'
    ? `Read about ${data.title.toLowerCase()} on ECHO NEWS. ${slug === 'about' ? 'Learn more about our mission and team.' : slug === 'terms' ? 'Review our terms and conditions for using ECHO NEWS services.' : slug === 'privacy' ? 'Understand how we collect and protect your personal information.' : slug === 'cookies' ? 'Learn about our cookie usage and how to manage your preferences.' : slug === 'accessibility' ? 'Our commitment to digital accessibility for all users.' : slug === 'sitemap' ? 'Navigate through all sections of ECHO NEWS website.' : slug === 'newsletters' ? 'Subscribe to our newsletters for daily news updates.' : ''}`
    : language === 'ar'
    ? `اقرأ عن ${data.title.toLowerCase()} على إيكو نيوز. ${slug === 'about' ? 'تعرف أكثر على مهمتنا وفريقنا.' : slug === 'terms' ? 'راجع أحكام وشروط استخدام خدمات إيكو نيوز.' : slug === 'privacy' ? 'افهم كيف نجمع ونحمي معلوماتك الشخصية.' : slug === 'cookies' ? 'تعرف على استخدامنا لملفات تعريف الارتباط وكيفية إدارة تفضيلاتك.' : slug === 'accessibility' ? 'التزامنا بإمكانية الوصول الرقمي لجميع المستخدمين.' : slug === 'sitemap' ? 'تصفح عبر جميع أقسام موقع إيكو نيوز.' : slug === 'newsletters' ? 'اشترك في نشراتنا البريدية لتحديثات الأخبار اليومية.' : ''}`
    : data.content.substring(0, 160);

  // Helper to render links in sitemap
  const renderContent = (text: string) => {
    if (slug === 'sitemap') {
      return text.split('\n').map((line, i) => {
        const linkMatch = line.match(/- \[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          return (
            <li key={i} className="mb-2 list-none">
              <Link to={linkMatch[2]} className="text-primary hover:underline font-medium text-lg">
                {linkMatch[1]}
              </Link>
            </li>
          );
        }
        if (line.trim() === '') return <br key={i} />;
        return <h3 key={i} className="text-xl font-bold mt-6 mb-3 text-zinc-900 dark:text-zinc-100">{line}</h3>;
      });
    }

    return text.split('\n').map((paragraph, index) => {
      if (paragraph.trim() === '') return null;
      // Check if it's a heading (starts with number or short line)
      if (/^\d+\./.test(paragraph) || (paragraph.length < 50 && !paragraph.endsWith('.'))) {
        return <h3 key={index} className="text-xl font-bold mt-8 mb-4 text-zinc-900 dark:text-zinc-100">{paragraph}</h3>;
      }
      if (paragraph.startsWith('- ')) {
        return <li key={index} className="ml-4 rtl:mr-4 rtl:ml-0 mb-2 text-zinc-700 dark:text-zinc-300">{paragraph.substring(2)}</li>;
      }
      return (
        <p key={index} className="mb-4 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          {paragraph}
        </p>
      );
    });
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={window.location.href} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
      </Helmet>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            {data.title}
          </h1>
          
          <div className="prose prose-lg prose-zinc dark:prose-invert max-w-none break-words">
            {slug === 'sitemap' ? (
              <ul className="pl-0 m-0">{renderContent(data.content)}</ul>
            ) : (
              renderContent(data.content)
          )}
        </div>
      </div>
    </motion.div>
  );
}
