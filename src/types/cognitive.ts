export interface DebateTranscript {
  proposerName: string;
  proposerText: string;
  proposerStyle: string;
  advisorName: string;
  advisorText: string;
  advisorRole: string;
  commanderText: string;
}

export interface DialogueLine {
  speaker: 'jesus' | 'caan' | 'system';
  text: string;
}

export interface CommentaryResponse {
  dialogue: DialogueLine[];
  debate: DebateTranscript;
}