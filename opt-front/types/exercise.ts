// types/exercise.ts
export interface ServerExercise {
    id: number;
    name: string;
    bodyPart: string;
    favorited: boolean;
    gifPath: string;
  }
  
export interface Exercise {
  id: number;
  name: string;
  bodyPart: string;
  isFavorite: boolean;
  imageSource?: string;
}
  
export interface ServerResponse {
  content: ServerExercise[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    unpaged: boolean;
  };
  size: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  totalElements: number;
  totalPages: number;
}

export interface FetchExercisesResult {
  exercises: Exercise[];
  hasMore: boolean;
  totalElements: number;
}

export interface ExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: () => void;
  selectedDate: string;
}

export interface ExerciseRecordFormProps {
  exercise: Exercise;
  onBack: () => void;
  onClose: () => void;
  onSave?: () => void;
  selectedDate: string;
}