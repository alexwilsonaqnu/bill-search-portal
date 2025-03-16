
import { Bill } from "@/types";

/**
 * Fallback data for development/demo when Supabase data is not available
 */
export const FALLBACK_BILLS: Bill[] = [
  {
    id: "IL-HB1234",
    title: "Education Funding Reform",
    description: "A bill to reform education funding in Illinois",
    status: "In Committee",
    lastUpdated: "2025-03-01",
    versions: [
      {
        id: "v1",
        name: "Original Version",
        status: "Introduced",
        date: "2025-01-15",
        sections: [
          {
            id: "s1",
            title: "Purpose",
            content: "This bill aims to reform the education funding system in Illinois."
          },
          {
            id: "s2",
            title: "Funding Formula",
            content: "The new funding formula will be based on student needs and district resources."
          }
        ]
      }
    ],
    changes: [
      {
        id: "c1",
        description: "Initial introduction of the bill"
      }
    ]
  },
  {
    id: "IL-SB5678",
    title: "Infrastructure Investment Act",
    description: "A comprehensive plan to improve Illinois infrastructure",
    status: "Passed Senate",
    lastUpdated: "2025-02-28",
    versions: [
      {
        id: "v1",
        name: "Original Version",
        status: "Introduced",
        date: "2025-01-10",
        sections: [
          {
            id: "s1",
            title: "Purpose",
            content: "This bill establishes a framework for infrastructure investment in Illinois."
          }
        ]
      }
    ],
    changes: [
      {
        id: "c1",
        description: "Initial introduction of the bill"
      },
      {
        id: "c2",
        description: "Amendment to include rural areas"
      }
    ]
  },
  {
    id: "IL-HB9012",
    title: "Healthcare Accessibility Act",
    description: "Expanding healthcare access to underserved communities",
    status: "In House",
    lastUpdated: "2025-03-10",
    versions: [
      {
        id: "v1",
        name: "Original Version",
        status: "Introduced",
        date: "2025-02-01",
        sections: [
          {
            id: "s1",
            title: "Purpose",
            content: "This bill aims to expand healthcare access across Illinois."
          }
        ]
      }
    ],
    changes: [
      {
        id: "c1",
        description: "Initial introduction of the bill"
      }
    ]
  },
  {
    id: "1635934",
    title: "Memorial Resolution 1635934",
    description: "Memorial resolution honoring the contributions of Illinois citizens",
    status: "Passed",
    lastUpdated: "2024-03-15",
    versions: [
      {
        id: "v1",
        name: "Original Version",
        status: "Introduced",
        date: "2024-02-01",
        sections: [
          {
            id: "s1",
            title: "Purpose",
            content: "This resolution honors the contributions of important Illinois citizens."
          }
        ]
      }
    ],
    changes: [
      {
        id: "c1",
        description: "Initial introduction of the resolution"
      },
      {
        id: "c2", 
        description: "Passed unanimously"
      }
    ]
  }
];
