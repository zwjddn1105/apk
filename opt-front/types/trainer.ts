// types/trainer.ts
interface SearchTrainerRequest {
    myLatitude?: number;
    myLongitude?: number;
    name?: string | null;
    address?: string | null;
    interests?: string[] | null;
    sortBy?: string | null;
  }
  
  interface TrainerResponse {
    trainer_id: number;
    gymId: number;
    intro: string;
    experienceYears: number;
    availableHours: string;
    oneDayAvailable: boolean;
  }