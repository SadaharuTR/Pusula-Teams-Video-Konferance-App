'use client'

import { useState } from "react"
import HomeCard from "./HomeCard"
import { useRouter } from "next/navigation";
import MeetingModal from "./MeetingModal";
import { useUser } from "@clerk/nextjs";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "./ui/textarea";
import { tr } from 'date-fns/locale';
import ReactDatePicker from 'react-datepicker';
import { Input } from "./ui/input";

const MeetingTypeList = () => {
    const router = useRouter();
    const [meetingState, setMeetingState] = useState<'isScheduleMeeting' | 'isJoiningMeeting' | 'isInstantMeeting' | undefined>()

    const {user} = useUser();
    const client = useStreamVideoClient();
    const [values, setValues] = useState({
      dateTime: new Date(),
      description: '',
      link: ''
    })
    const [callDetails, setCallDetails] = useState<Call>()
    const {toast} = useToast();

    const createMeeting = async () => {
      if(!client || !user) return;

      try {
        if(!values.dateTime){
          toast({
            title: "Lütfen toplantı tarihini ve zamanını seçiniz."
          })
          return;
        }
        const id = crypto.randomUUID();
        const call = client.call('default', id);

        if(!call) throw new Error('Aramaya başarısız.');

        const startsAt = values.dateTime.toISOString() ||
        new Date(Date.now()).toISOString();
        const description = values.description || 'Anında Toplantı';

        await call.getOrCreate({
          data: {
            starts_at: startsAt,
            custom: {
              description
            }
          }
        })
      setCallDetails(call);
      if(!values.description){
        router.push(`/meeting/${call.id}`)
      }
      toast({
        title: "Toplantı oluşturuldu."
      })
      } catch (error) {
        console.log(error);
        toast({
          title: "Toplantı oluşturma başarısız."
        })
      }
    }

    const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetails?.id}`

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <HomeCard
        img="/icons/add-meeting.svg"
        title="Yeni Toplantı"
        description="Bir toplantı başlat."
        handleClick={() => setMeetingState('isInstantMeeting')}
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Toplantıya Katıl"
        description="Katılım linki ile katıl."
        className="bg-blue-1"
        handleClick={() => setMeetingState('isJoiningMeeting')}
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Toplantı Ayarla"
        description="İleri vakitte bir toplantı ayarla."
        className="bg-purple-1"
        handleClick={() => setMeetingState('isScheduleMeeting')}
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="Kayıtları Görüntüle"
        description="Toplantı Kayıtları"
        className="bg-yellow-1"
        handleClick={() => router.push('/recordings')}
      />

      {!callDetails ? (
        <MeetingModal
        isOpen = {meetingState === 'isScheduleMeeting'}
        onClose = {() => setMeetingState(undefined)}
        title = "Bir toplantı düzenle!"
        handleClick = {createMeeting}
        >
          <div className="flex flex-col gap-3">
            <label className="text-base text-normal leading-[22px] text-sky-2">
              Bir tanım ekle.
            </label>
            <Textarea className="border-none bg-dark-3 focus-visible:ring-0 focus-visible-ring-offset-0" 
            onChange={(e) => {
              setValues({...values, description: e.target.value})
            }}
            />          
          </div>
          <div className="flex w-full flex-col gap-3">
            <label className="text-base text-normal leading-[22px] text-sky-2">
              Bir Tarih Belirle!
            </label>
            <ReactDatePicker 
              selected = {values.dateTime}
              onChange={(date) => setValues({...values, dateTime: date!})}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="Saat"
              dateFormat="d MMMM yyyy HH:mm"
              locale={tr}
              className="w-full rounded bg-dark-3 p-2 focus:outline-none"
            />
          </div>
        </MeetingModal>
        
      ) :(
        <MeetingModal
        isOpen = {meetingState === 'isScheduleMeeting'}
        onClose = {() => setMeetingState(undefined)}
        title = "Toplantı düzenlendi!"
        className = "text-center"
        handleClick = {() => {
          navigator.clipboard.writeText(meetingLink);
          // toast({ title: Link kopyalandı. })
        }}
        image="/icons/checked.svg"
        buttonIcon="/icons/copy.svg"
        buttonText="Toplantı linkini kopyala."
        />
      )}
        <MeetingModal
        isOpen = {meetingState === 'isInstantMeeting'}
        onClose = {() => setMeetingState(undefined)}
        title = "Bir toplantı başlat!"
        className = "text-center"
        buttonText = "Toplantıyı başlat."
        handleClick = {createMeeting}
        />

        <MeetingModal
        isOpen = {meetingState === 'isJoiningMeeting'}
        onClose = {() => setMeetingState(undefined)}
        title = "Linki buraya kopyalayın."
        className = "text-center"
        buttonText = "Toplantıya katıl."
        handleClick = {() => 
          router.push(values.link)
        }>
          <Input 
            className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Toplantı linki..."
            onChange={(e) => setValues({...values, link: e.target.value})}
          />
        </MeetingModal>
    </section>
  )
}

export default MeetingTypeList