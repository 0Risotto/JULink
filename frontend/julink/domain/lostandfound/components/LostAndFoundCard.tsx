import React, { useState } from "react";
import { LostAndFoundResponse, CollegeEnum } from "../types";
import { markAsFound } from "../service/lostAndFoundService";
import { useUser } from "@/domain/profile/hooks/useUser";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  item: LostAndFoundResponse;
  onUpdate: (updatedItem: LostAndFoundResponse) => void;
}

const formatCollegeName = (college: CollegeEnum) => {
  return college.split("_").map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(" ");
};

import Link from "next/link";
import { UserCircle } from "lucide-react";

export default function LostAndFoundCard({ item, onUpdate }: Props) {
  const { myUsername } = useUser();
  const [loading, setLoading] = useState(false);

  const isOwner = myUsername === item.ownerUsername;

  const handleMarkAsFound = async () => {
    try {
      setLoading(true);
      const res = await markAsFound(item.id);
      onUpdate(res);
    } catch (error) {
      console.error("Failed to mark as found:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full mb-4 overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <Badge variant={item.isFound ? "default" : "destructive"} className="w-fit mb-2">
              {item.isFound ? "Resolved (Found)" : "Not Resolved (Lost)"}
            </Badge>
            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <MapPin className="w-4 h-4" />
              <span>{formatCollegeName(item.college)}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <UserCircle className="w-4 h-4" />
              <Link href={`/${item.ownerUsername}`} className="hover:underline">
                @{item.ownerUsername}
              </Link>
            </div>
          </div>
          {isOwner && !item.isFound && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleMarkAsFound} 
              disabled={loading}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {loading ? "Updating..." : "Mark as Found"}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <p className="whitespace-pre-wrap text-sm mb-4">{item.description}</p>
        
        {item.imageURL && (
          <div className="relative w-full rounded-md overflow-hidden bg-muted flex items-center justify-center max-h-[400px]">
            <img 
              src={item.imageURL} 
              alt="Lost item" 
              className="object-contain max-h-[400px] w-full"
            />
          </div>
        )}
      </CardContent>
      
      {item.phoneNumber && (
        <CardFooter className="p-4 pt-0">
          <div className="flex items-center gap-2 text-sm font-medium bg-muted px-3 py-2 rounded-md w-full">
            <Phone className="w-4 h-4 text-primary" />
            <span>Contact: {item.phoneNumber}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
