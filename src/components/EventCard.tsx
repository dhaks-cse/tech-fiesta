import React from "react";
import { Event } from "@/types";
import { generateRegistrationUrl } from "@/utils/registration";
import SpotlightCard from "./ReactBits/SpotlightCard/SpotlightCard";
import EventFaqModal from "./EventFaqModal";

interface EventCardProps {
  event: Event;
  isSelected?: boolean;
  onSelect?: (event: Event) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, isSelected = false, onSelect }) => {
  const formatDate = (dateString: string): string => {
    if (dateString === "2026-08-07") {
      return "Fri, Aug 7, 2026";
    }
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const handleRegisterClick = () => {
    if (onSelect) {
      onSelect(event);
    } else {
      const eventType = event.type === "tech" ? "event" : "non-tech";
      const registrationUrl = generateRegistrationUrl(event.id, eventType);
      window.location.href = registrationUrl;
    }
  };

  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const isLongDescription = event.description.length > 120;

  return (
    <>
      <SpotlightCard 
        className={`h-full flex flex-col bg-white/10 backdrop-blur-md rounded-lg border transition-all duration-300 hover:scale-105 ${
          isSelected 
            ? "border-red-500 bg-red-950/20 shadow-[0_0_15px_rgba(220,38,38,0.15)]" 
            : "border-white/20 hover:bg-white/15"
        }`}
        spotlightColor="rgba(220, 38, 38, 0.4)"
      >
        {/* Event Type Badge and Price */}
        <div className="flex justify-between items-start mb-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              event.type === "tech"
                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                : "bg-red-500/20 text-red-300 border border-red-500/30"
            }`}
          >
            {event.type === "tech" ? "Tech Event" : "Non-Tech Event"}
          </span>
          {event.price && (
            <span className="text-lg font-bold text-white">{event.price}</span>
          )}
        </div>
        {/* Event Title */}
        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">
          {event.title}
        </h3>
        {/* Event Details */}
        <div className="space-y-2 mb-4 text-gray-300">
          <div className="flex items-center text-sm">
            <svg
              className="w-4 h-4 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            <span>{formatDate(event.date)}</span>
          </div>

          <div className="flex items-center text-sm">
            <svg
              className="w-4 h-4 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{event.venue}</span>
          </div>
        </div>
        {/* Description */}
        <div>
          <p className={`text-gray-300 text-sm ${isExpanded ? "" : "line-clamp-3"}`}>
            {event.description}
          </p>
          {isLongDescription && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-red-400 hover:text-red-300 text-xs font-semibold mt-1 mb-4 focus:outline-none cursor-pointer block"
            >
              {isExpanded ? "Show Less" : "Read More"}
            </button>
          )}
          {!isLongDescription && <div className="mb-4" />}
        </div>
        {/* Speakers */}
        {event.speakers && event.speakers.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white mb-2">Speakers:</h4>
            <div className="flex flex-wrap gap-2">
              {event.speakers.map((speaker: string, index: number) => (
                <span
                  key={index}
                  className="bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-1 rounded text-xs"
                >
                  {speaker}
                </span>
              ))}
            </div>
          </div>
        )}
        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {event.tags.slice(0, 3).map((tag: string, index: number) => (
                <span
                  key={index}
                  className="bg-gray-500/20 text-gray-300 px-2 py-1 rounded-full text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}{" "}
        {/* Registration Info */}
        <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/10">
          {event.rulebookPath ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="text-red-400 hover:text-red-300 text-xs sm:text-sm font-semibold flex items-center gap-1 cursor-pointer focus:outline-none transition-colors"
            >
              Rules & FAQs
            </button>
          ) : (
            <div />
          )}
          <button 
            onClick={handleRegisterClick}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-md flex items-center gap-1 cursor-pointer ${
              isSelected 
                ? "bg-red-950/80 border border-red-500/50 text-white hover:bg-red-700 hover:border-red-500 shadow-[0_4px_12px_rgba(220,38,38,0.25)] hover:shadow-[0_4px_16px_rgba(220,38,38,0.4)]" 
                : "bg-red-600 text-white hover:bg-red-700 shadow-[0_4px_12px_rgba(220,38,38,0.2)] hover:shadow-[0_4px_16px_rgba(220,38,38,0.4)]"
            }`}
          >
            {isSelected ? "✓ Selected" : "Register Now"}
          </button>
        </div>
      </SpotlightCard>

      <EventFaqModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={event.title}
        rulebookPath={event.rulebookPath}
        coordinators={event.coordinators}
      />
    </>
  );
};

export default EventCard;
