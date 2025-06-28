import { useCallback } from 'react';
import { SubmissionWithReplies } from '../../../app/components/submissions-list/actions';
import { SubmissionsState } from './types';

interface UseOptimisticUpdatesProps {
  submissionsState: SubmissionsState;
  setSubmissionsState: (updater: (prevState: SubmissionsState) => SubmissionsState) => void;
  infiniteScroll: boolean;
  infiniteData: SubmissionWithReplies[];
  setInfiniteData: (updater: (prev: SubmissionWithReplies[]) => SubmissionWithReplies[]) => void;
}

export function useOptimisticUpdates({
  submissionsState,
  setSubmissionsState,
  infiniteScroll,
  infiniteData,
  setInfiniteData
}: UseOptimisticUpdatesProps) {
  
  const optimisticUpdateSubmission = useCallback(
    (submissionId: number, updatedSubmission: any) => {
      const currentState = submissionsState;
      if (currentState.data) {
        const updatedSubmissions = currentState.data.submissions.map(
          (submission) =>
            submission.submission_id === submissionId
              ? { ...submission, ...updatedSubmission }
              : submission
        );

        setSubmissionsState((prevState) => ({
          ...prevState,
          data: {
            submissions: updatedSubmissions,
            pagination: currentState.data!.pagination
          }
        }));
      }
    },
    [submissionsState, setSubmissionsState]
  );

  const optimisticRemoveSubmission = useCallback(
    (submissionId: number) => {
      const currentState = submissionsState;
      if (currentState.data) {
        const updatedSubmissions = currentState.data.submissions.filter(
          (submission) => submission.submission_id !== submissionId
        );
        const updatedPagination = {
          ...currentState.data.pagination,
          totalRecords: Math.max(
            0,
            currentState.data.pagination.totalRecords - 1
          )
        };

        setSubmissionsState((prevState) => ({
          ...prevState,
          data: {
            submissions: updatedSubmissions,
            pagination: updatedPagination
          }
        }));

        // Also update infinite scroll data if in infinite mode
        if (infiniteScroll) {
          setInfiniteData((prev) =>
            prev.filter(
              (submission) => submission.submission_id !== submissionId
            )
          );
        }
      }
    },
    [submissionsState, setSubmissionsState, infiniteScroll, setInfiniteData]
  );

  return {
    optimisticUpdateSubmission,
    optimisticRemoveSubmission
  };
} 