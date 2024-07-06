// @ts-nocheck

'use client';

import { Call, CallRecording } from '@stream-io/video-react-sdk';

import Loader from './Loader';
import { useGetCalls } from '@/hooks/useGetCalls';
import MeetingCard from './MeetingCard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './ui/use-toast';

const CallList = ({ type }: {type:'ended' | 'upcoming' | 'recordings'}) => {
    const { endedCalls, upcomingCalls, callRecordings, isLoading } = useGetCalls();

    const router = useRouter();
    const [recordings, setRecordings] = useState<CallRecording[]>([])
    const {toast} = useToast();

    const getCalls = () => {
        switch (type) {
            case 'ended':
                return endedCalls;
            case 'recordings':
                return recordings;    
            case 'upcoming':
                return upcomingCalls;          
            default:
                return [];
        }
    }

    const getNoCallsMessage = () => {
        switch (type) {
            case 'ended':
                return 'Önceki Arama Yok.';
            case 'recordings':
                return 'Kayıt Bulunamadı.';    
            case 'upcoming':
                return 'Bekleyen Arama Yok.';          
            default:
                return '';
        }
    }

    useEffect(() => {
        const fetchRecordings = async () => {
            
            const callData = await Promise.all(callRecordings.map((meeting) => meeting.queryRecordings()) ?? [])

            const recordings = callData
                .filter((call) => call.recordings.length > 0)
                .flatMap((call) => call.recordings)

            setRecordings(recordings);                    
        }
        if (type === 'recordings') {
            fetchRecordings();
        }
    }, [type, callRecordings])

    const calls = getCalls();
    const noCallsMessage = getNoCallsMessage();

    if(isLoading) return <Loader />

  return (
    <div className="grid  grid-cols-1 gap-5 xl:grid-cols-2">
        {calls && calls.length > 0 ?  calls.map((meeting: Call | CallRecording) => (
            <MeetingCard 
            key={( meeting as Call).id}
            icon={
                type === 'ended'
                ? '/icons/previous.svg'
                : type === 'upcoming'
                ? '/icons/upcoming.svg'
                : '/icons/recordings.svg'
            }
            title={(meeting as Call).state?.custom?.description?.substring(0,26) || meeting?.filename?.substring(0,20) || 'Kişisel Toplantı'}
            date={meeting.state?.startsAt.toLocaleString() || meeting.start_time.toLocaleString()}
            isPreviousMeeting={type === 'ended'}
            buttonIcon1={type === 'recordings' ? '/icons/play.svg' : undefined}
            buttonText={type === 'recordings' ? 'Oynat' : 'Başlat'}
            handleClick={type === 'recordings' ? () => router.push(`${meeting.url}`) : () => router.push(`/meeting/${meeting.id}`)}
            link={type === 'recordings' ? meeting.url : `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meeting.id}`}      
            />
        )) : (
            <h1>{noCallsMessage}</h1>     
        )}
    </div>
  )
}

export default CallList