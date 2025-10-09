"use client";
import dynamic from "next/dynamic";
import { Loader } from "@/components/ui/loader";

// Loading component for all dynamic imports
const ReadingLoadingComponent = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Loader />
      <p className="text-gray-600 mt-4">Loading reading section...</p>
    </div>
  </div>
);

// Goethe A1 Components
const GoetheA1ReadingSection1 = dynamic(
  () => import("./goethe_a1_components/reading/goethe_a1_reading_section_1"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const GoetheA1ReadingSection2 = dynamic(
  () => import("./goethe_a1_components/reading/goethe_a1_reading_section_2"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const GoetheA1ReadingSection3 = dynamic(
  () => import("./goethe_a1_components/reading/goethe_a1_reading_section_3"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

// TELC A1 Components
const TelcA1ReadingSection1 = dynamic(
  () => import("./telc_a1_components/reading/telc_a1_reading_section_1"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const TelcA1ReadingSection2 = dynamic(
  () => import("./telc_a1_components/reading/telc_a1_reading_section_2"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const TelcA1ReadingSection3 = dynamic(
  () => import("./telc_a1_components/reading/telc_a1_reading_section_3"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

// TELC A2 Components
const TelcA2ReadingSection1 = dynamic(
  () => import("./telc_a2_components/reading/telc_a2_reading_section_1"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const TelcA2ReadingSection2 = dynamic(
  () => import("./telc_a2_components/reading/telc_a2_reading_section_2"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const TelcA2ReadingSection3 = dynamic(
  () => import("./telc_a2_components/reading/telc_a2_reading_section_3"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const TelcA2ReadingSection4 = dynamic(
  () => import("./telc_a2_components/reading/telc_a2_reading_section_4"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const TelcA2ReadingSection5 = dynamic(
  () => import("./telc_a2_components/reading/telc_a2_reading_section_5"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

// Goethe A2 Components
const GoetheA2ReadingSection1 = dynamic(
  () => import("./goethe_a2_components/reading/goethe_a2_reading_section_1"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const GoetheA2ReadingSection2 = dynamic(
  () => import("./goethe_a2_components/reading/goethe_a2_reading_section_2"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const GoetheA2ReadingSection3 = dynamic(
  () => import("./goethe_a2_components/reading/goethe_a2_reading_section_3"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const GoetheA2ReadingSection4 = dynamic(
  () => import("./goethe_a2_components/reading/goethe_a2_reading_section_4"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

// Goethe B1 Components
const GoetheB1ReadingSection1 = dynamic(
  () => import("./goethe_b1_components/reading/goethe_b1_reading_section_1"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const GoetheB1ReadingSection2 = dynamic(
  () => import("./goethe_b1_components/reading/goethe_b1_reading_section_2"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const GoetheB1ReadingSection3 = dynamic(
  () => import("./goethe_b1_components/reading/goethe_b1_reading_section_3"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const GoetheB1ReadingSection4 = dynamic(
  () => import("./goethe_b1_components/reading/goethe_b1_reading_section_4"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const GoetheB1ReadingSection5 = dynamic(
  () => import("./goethe_b1_components/reading/goethe_b1_reading_section_5"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

// TELC B1 Components
const TelcB1ReadingSection1 = dynamic(
  () => import("./telc_b1_components/reading/telc_b1_reading_section_1"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const TelcB1ReadingSection2 = dynamic(
  () => import("./telc_b1_components/reading/telc_b1_reading_section_2"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const TelcB1ReadingSection3 = dynamic(
  () => import("./telc_b1_components/reading/telc_b1_reading_section_3"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

// TELC B2 Components
const TelcB2ReadingSection1 = dynamic(
  () => import("./telc_b2_components/reading/telc_b2_reading_section_1"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const TelcB2ReadingSection2 = dynamic(
  () => import("./telc_b2_components/reading/telc_b2_reading_section_2"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const TelcB2ReadingSection3 = dynamic(
  () => import("./telc_b2_components/reading/telc_b2_reading_section_3"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

// Goethe B2 Components
const GoetheB2ReadingSection1 = dynamic(
  () => import("./goethe_b2_components/reading/goethe_b2_reading_section_1"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const GoetheB2ReadingSection2 = dynamic(
  () => import("./goethe_b2_components/reading/goethe_b2_reading_section_2"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const GoetheB2ReadingSection3 = dynamic(
  () => import("./goethe_b2_components/reading/goethe_b2_reading_section_3"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const GoetheB2ReadingSection4 = dynamic(
  () => import("./goethe_b2_components/reading/goethe_b2_reading_section_4"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const GoetheB2ReadingSection5 = dynamic(
  () => import("./goethe_b2_components/reading/goethe_b2_reading_section_5"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

// Goethe C1 Components
const GoetheC1ReadingSection1 = dynamic(
  () => import("./goethe_c1_components/reading/goethe_c1_reading_section_1"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const GoetheC1ReadingSection2 = dynamic(
  () => import("./goethe_c1_components/reading/goethe_c1_reading_section_2"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const GoetheC1ReadingSection3 = dynamic(
  () => import("./goethe_c1_components/reading/goethe_c1_reading_section_3"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const GoetheC1ReadingSection4 = dynamic(
  () => import("./goethe_c1_components/reading/goethe_c1_reading_section_4"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

const GoetheC1ReadingSection5 = dynamic(
  () => import("./goethe_c1_components/reading/goethe_c1_reading_section_5"),
  {
    loading: () => <ReadingLoadingComponent />,
    ssr: false,
  },
);

interface DynamicReadingSectionProps {
  courseType: string;
  sectionNumber: number;
  data: any;
  initialMode: string;
  navigation: any;
  testId?: string;
  examId?: string | null;
}

export default function DynamicReadingSection({
  courseType,
  sectionNumber,
  data,
  initialMode,
  navigation,
  testId,
  examId,
}: DynamicReadingSectionProps) {
  // Early return for unsupported combinations
  if (!data) {
    return <ReadingLoadingComponent />;
  }

  const navigationProps = navigation;

  // Route to appropriate component based on course type and section
  switch (courseType) {
    case "goethe_a1":
      switch (sectionNumber) {
        case 1:
          return (
            <GoetheA1ReadingSection1
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
            />
          );
        case 2:
          return (
            <GoetheA1ReadingSection2
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
            />
          );
        case 3:
          return (
            <GoetheA1ReadingSection3
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
            />
          );
        default:
          return (
            <div className="p-8 text-center text-gray-600">
              Section {sectionNumber} not available for Goethe A1.
            </div>
          );
      }

    case "telc_a1":
      switch (sectionNumber) {
        case 1:
          return (
            <TelcA1ReadingSection1
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              examId={examId}
              testId={testId}
            />
          );
        case 2:
          return (
            <TelcA1ReadingSection2
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              examId={examId}
              testId={testId}
            />
          );
        case 3:
          return (
            <TelcA1ReadingSection3
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              examId={examId}
              testId={testId}
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
            <TelcA2ReadingSection1
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              examId={examId}
              testId={testId}
            />
          );
        case 2:
          return (
            <TelcA2ReadingSection2
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              examId={examId}
              testId={testId}
            />
          );
        case 3:
          return (
            <TelcA2ReadingSection3
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              examId={examId}
              testId={testId}
            />
          );
        case 4:
          return (
            <TelcA2ReadingSection4
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
            />
          );
        case 5:
          return (
            <TelcA2ReadingSection5
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
            />
          );
        default:
          return (
            <div className="p-8 text-center text-gray-600">
              Section {sectionNumber} not available for TELC A2.
            </div>
          );
      }

    case "goethe_a2":
      switch (sectionNumber) {
        case 1:
          return (
            <GoetheA2ReadingSection1
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
            />
          );
        case 2:
          return (
            <GoetheA2ReadingSection2
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
            />
          );
        case 3:
          return (
            <GoetheA2ReadingSection3
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
            />
          );
        case 4:
          return (
            <GoetheA2ReadingSection4
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
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
            <GoetheB1ReadingSection1
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
            />
          );
        case 2:
          return (
            <GoetheB1ReadingSection2
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
            />
          );
        case 3:
          return (
            <GoetheB1ReadingSection3
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
            />
          );
        case 4:
          return (
            <GoetheB1ReadingSection4
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
            />
          );
        case 5:
          return (
            <GoetheB1ReadingSection5
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
            />
          );
        default:
          return (
            <div className="p-8 text-center text-gray-600">
              Section {sectionNumber} not available for Goethe B1.
            </div>
          );
      }

    case "telc_b1":
      switch (sectionNumber) {
        case 1:
          return (
            <TelcB1ReadingSection1
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 2:
          return (
            <TelcB1ReadingSection2
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 3:
          return (
            <TelcB1ReadingSection3
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

    case "goethe_b2":
      switch (sectionNumber) {
        case 1:
          return (
            <GoetheB2ReadingSection1
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 2:
          return (
            <GoetheB2ReadingSection2
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 3:
          return (
            <GoetheB2ReadingSection3
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 4:
          return (
            <GoetheB2ReadingSection4
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 5:
          return (
            <GoetheB2ReadingSection5
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

    case "telc_b2":
      switch (sectionNumber) {
        case 1:
          return (
            <TelcB2ReadingSection1
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 2:
          return (
            <TelcB2ReadingSection2
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 3:
          return (
            <TelcB2ReadingSection3
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

    case "goethe_c1":
      switch (sectionNumber) {
        case 1:
          return (
            <GoetheC1ReadingSection1
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 2:
          return (
            <GoetheC1ReadingSection2
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 3:
          return (
            <GoetheC1ReadingSection3
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 4:
          return (
            <GoetheC1ReadingSection4
              data={data}
              initialMode={initialMode}
              navigation={navigationProps}
              testId={testId}
              examId={examId}
            />
          );
        case 5:
          return (
            <GoetheC1ReadingSection5
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
              Section {sectionNumber} not available for Goethe C1.
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