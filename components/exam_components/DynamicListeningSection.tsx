"use client";
import dynamic from "next/dynamic";
import { Loader } from "@/components/ui/loader";

// Loading component for all dynamic imports
const ListeningLoadingComponent = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Loader />
      <p className="text-gray-600 mt-4">Loading listening section...</p>
    </div>
  </div>
);

// Goethe A1 Components - Lazy loaded (Standardized)
const GoetheA1ListeningSection1 = dynamic(
  () => import("./goethe_a1_components/listening/goethe_a1_listening_section_1"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const GoetheA1ListeningSection2 = dynamic(
  () => import("./goethe_a1_components/listening/goethe_a1_listening_section_2"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const GoetheA1ListeningSection3 = dynamic(
  () => import("./goethe_a1_components/listening/goethe_a1_listening_section_3"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

// Goethe A2 Components - Lazy loaded (Standardized)
const GoetheA2ListeningSection1 = dynamic(
  () => import("./goethe_a2_components/listening/goethe_a2_listening_section_1"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const GoetheA2ListeningSection2 = dynamic(
  () => import("./goethe_a2_components/listening/goethe_a2_listening_section_2"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const GoetheA2ListeningSection3 = dynamic(
  () => import("./goethe_a2_components/listening/goethe_a2_listening_section_3"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const GoetheA2ListeningSection4 = dynamic(
  () => import("./goethe_a2_components/listening/goethe_a2_listening_section_4"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

// Goethe B1 Components - Lazy loaded (Standardized)
const GoetheB1ListeningSection1 = dynamic(
  () => import("./goethe_b1_components/listening/goethe_b1_listening_section_1"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const GoetheB1ListeningSection2 = dynamic(
  () => import("./goethe_b1_components/listening/goethe_b1_listening_section_2"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const GoetheB1ListeningSection3 = dynamic(
  () => import("./goethe_b1_components/listening/goethe_b1_listening_section_3"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const GoetheB1ListeningSection4 = dynamic(
  () => import("./goethe_b1_components/listening/goethe_b1_listening_section_4"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

// Goethe B2 Components - Lazy loaded (Standardized)
const GoetheB2ListeningSection1 = dynamic(
  () => import("./goethe_b2_components/listening/goethe_b2_listening_section_1"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const GoetheB2ListeningSection2 = dynamic(
  () => import("./goethe_b2_components/listening/goethe_b2_listening_section_2"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const GoetheB2ListeningSection3 = dynamic(
  () => import("./goethe_b2_components/listening/goethe_b2_listening_section_3"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const GoetheB2ListeningSection4 = dynamic(
  () => import("./goethe_b2_components/listening/goethe_b2_listening_section_4"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

// TELC A1 Components - Lazy loaded (Standardized)
const TelcA1ListeningSection1 = dynamic(
  () => import("./telc_a1_components/listening/telc_a1_listening_section_1"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const TelcA1ListeningSection2 = dynamic(
  () => import("./telc_a1_components/listening/telc_a1_listening_section_2"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const TelcA1ListeningSection3 = dynamic(
  () => import("./telc_a1_components/listening/telc_a1_listening_section_3"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

// TELC A2 Components - Lazy loaded (Standardized)
const TelcA2ListeningSection1 = dynamic(
  () => import("./telc_a2_components/listening/telc_a2_listening_section_1"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const TelcA2ListeningSection2 = dynamic(
  () => import("./telc_a2_components/listening/telc_a2_listening_section_2"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const TelcA2ListeningSection3 = dynamic(
  () => import("./telc_a2_components/listening/telc_a2_listening_section_3"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

// TELC B1 Components - Lazy loaded (Standardized)
const TelcB1ListeningSection1 = dynamic(
  () => import("./telc_b1_components/listening/telc_b1_listening_section_1"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const TelcB1ListeningSection2 = dynamic(
  () => import("./telc_b1_components/listening/telc_b1_listening_section_2"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const TelcB1ListeningSection3 = dynamic(
  () => import("./telc_b1_components/listening/telc_b1_listening_section_3"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

// TELC B2 Components - Lazy loaded (Standardized)
const TelcB2ListeningSection1 = dynamic(
  () => import("./telc_b2_components/listening/telc_b2_listening_section_1"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const TelcB2ListeningSection2 = dynamic(
  () => import("./telc_b2_components/listening/telc_b2_listening_section_2"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

const TelcB2ListeningSection3 = dynamic(
  () => import("./telc_b2_components/listening/telc_b2_listening_section_3"),
  {
    loading: () => <ListeningLoadingComponent />,
    ssr: false,
  },
);

interface DynamicListeningSectionProps {
  courseType: string;
  sectionNumber: number;
  data: any;
  initialMode: string;
  navigation: any;
  testId?: string;
  examId?: string | null;
}

export default function DynamicListeningSection({
  courseType,
  sectionNumber,
  data,
  initialMode,
  navigation,
  testId,
  examId,
}: DynamicListeningSectionProps) {
  // Early return for unsupported combinations
  if (!data) {
    return <ListeningLoadingComponent />;
  }

  const navigationProps = navigation;

  // Route to appropriate component based on course type and section
  switch (courseType) {
    case "goethe_a1":
      switch (sectionNumber) {
        case 1:
          return (
            <GoetheA1ListeningSection1
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 2:
          return (
            <GoetheA1ListeningSection2
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 3:
          return (
            <GoetheA1ListeningSection3
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        default:
          return (
            <div className="p-8 text-center text-gray-600">
              Section {sectionNumber} not available for Goethe A1.
            </div>
          );
      }

    case "goethe_a2":
      switch (sectionNumber) {
        case 1:
          return (
            <GoetheA2ListeningSection1
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 2:
          return (
            <GoetheA2ListeningSection2
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 3:
          return (
            <GoetheA2ListeningSection3
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 4:
          return (
            <GoetheA2ListeningSection4
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        default:
          return (
            <div className="p-8 text-center text-gray-600">
              Section {sectionNumber} not available for Goethe A2.
            </div>
          );
      }

    case "goethe_b1":
      switch (sectionNumber) {
        case 1:
          return (
            <GoetheB1ListeningSection1
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 2:
          return (
            <GoetheB1ListeningSection2
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 3:
          return (
            <GoetheB1ListeningSection3
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 4:
          return (
            <GoetheB1ListeningSection4
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        default:
          return (
            <div className="p-8 text-center text-gray-600">
              Section {sectionNumber} not available for Goethe B1.
            </div>
          );
      }

    case "goethe_b2":
      switch (sectionNumber) {
        case 1:
          return (
            <GoetheB2ListeningSection1
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 2:
          return (
            <GoetheB2ListeningSection2
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 3:
          return (
            <GoetheB2ListeningSection3
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 4:
          return (
            <GoetheB2ListeningSection4
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        default:
          return (
            <div className="p-8 text-center text-gray-600">
              Section {sectionNumber} not available for Goethe B2.
            </div>
          );
      }

    case "telc_a1":
      switch (sectionNumber) {
        case 1:
          return (
            <TelcA1ListeningSection1
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 2:
          return (
            <TelcA1ListeningSection2
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 3:
          return (
            <TelcA1ListeningSection3
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        default:
          return (
            <div className="p-8 text-center text-gray-600">
              Section {sectionNumber} not available for TELC A1.
            </div>
          );
      }

    case "telc_a2":
      switch (sectionNumber) {
        case 1:
          return (
            <TelcA2ListeningSection1
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 2:
          return (
            <TelcA2ListeningSection2
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 3:
          return (
            <TelcA2ListeningSection3
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        default:
          return (
            <div className="p-8 text-center text-gray-600">
              Section {sectionNumber} not available for TELC A2.
            </div>
          );
      }

    case "telc_b1":
      switch (sectionNumber) {
        case 1:
          return (
            <TelcB1ListeningSection1
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 2:
          return (
            <TelcB1ListeningSection2
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 3:
          return (
            <TelcB1ListeningSection3
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        default:
          return (
            <div className="p-8 text-center text-gray-600">
              Section {sectionNumber} not available for TELC B1.
            </div>
          );
      }

    case "telc_b2":
      switch (sectionNumber) {
        case 1:
          return (
            <TelcB2ListeningSection1
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 2:
          return (
            <TelcB2ListeningSection2
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 3:
          return (
            <TelcB2ListeningSection3
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        default:
          return (
            <div className="p-8 text-center text-gray-600">
              Section {sectionNumber} not available for TELC B2.
            </div>
          );
      }

    default:
      return (
        <div className="p-8 text-center text-gray-600">
          <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
          <p>The course type "{courseType}" is not supported.</p>
        </div>
      );
  }
}