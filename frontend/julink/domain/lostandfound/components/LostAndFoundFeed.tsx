"use client";

import React, { useEffect, useState, useRef } from "react";
import { getLostAndFounds } from "../service/lostAndFoundService";
import { CollegeEnum, LostAndFoundResponse } from "../types";
import LostAndFoundCard from "./LostAndFoundCard";
import CreateLostAndFoundModal from "./CreateLostAndFoundModal";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LostAndFoundFeed() {
  const [items, setItems] = useState<LostAndFoundResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "RESOLVED">("PENDING");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "LOST" | "FOUND">("ALL");
  const [collegeFilter, setCollegeFilter] = useState<string>("ALL");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchItems(0, true);
  }, [statusFilter, typeFilter, collegeFilter]);

  const fetchItems = async (pageNum: number, reset: boolean = false) => {
    try {
      if (pageNum === 0) {
        setLoading(true);
      } else {
        setFetchingMore(true);
      }
      
      let isResolvedParam: boolean | undefined = undefined;
      if (statusFilter === "RESOLVED") isResolvedParam = true;
      if (statusFilter === "PENDING") isResolvedParam = false;

      const res = await getLostAndFounds(
        collegeFilter, 
        typeFilter, 
        isResolvedParam, 
        pageNum, 
        10
      );
      
      if (reset) {
        setItems(res.content);
      } else {
        setItems((prev) => [...prev, ...res.content]);
      }
      
      setHasMore(!res.last);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch lost and found items", error);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && !fetchingMore && hasMore) {
      fetchItems(page + 1);
    }
  };

  useEffect(() => {
    if (!hasMore || loading || fetchingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, fetchingMore, page, statusFilter, typeFilter, collegeFilter]);

  const handleItemUpdated = (updatedItem: LostAndFoundResponse) => {
    setItems(prev => prev.map(p => p.id === updatedItem.id ? updatedItem : p));
  };

  const handleItemCreated = (newItem: LostAndFoundResponse) => {
    // If the new item matches current filters, add it to the top
    const matchesStatus = statusFilter === "ALL" || 
      (statusFilter === "RESOLVED" && newItem.isResolved) || 
      (statusFilter === "PENDING" && !newItem.isResolved);
      
    const matchesType = typeFilter === "ALL" || typeFilter === newItem.type;
    
    const matchesCollege = collegeFilter === "ALL" || collegeFilter === newItem.college;

    if (matchesStatus && matchesType && matchesCollege) {
      setItems(prev => [newItem, ...prev]);
    }
  };

  return (
    <div className="w-full flex flex-col items-center pt-4 pb-20 px-4">
      <div className="w-full max-w-[600px] flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Lost & Found</h1>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </div>

      <div className="w-full max-w-[600px] flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex bg-muted p-1 rounded-lg w-full sm:w-1/2">
            <button 
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === "ALL" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setStatusFilter("ALL")}
            >
              All Status
            </button>
            <button 
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === "PENDING" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setStatusFilter("PENDING")}
            >
              Pending
            </button>
            <button 
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === "RESOLVED" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setStatusFilter("RESOLVED")}
            >
              Resolved
            </button>
          </div>

          <div className="flex bg-muted p-1 rounded-lg w-full sm:w-1/2">
            <button 
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${typeFilter === "ALL" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setTypeFilter("ALL")}
            >
              All Types
            </button>
            <button 
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${typeFilter === "LOST" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setTypeFilter("LOST")}
            >
              Lost
            </button>
            <button 
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${typeFilter === "FOUND" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setTypeFilter("FOUND")}
            >
              Found
            </button>
          </div>
        </div>

        <div className="w-full">
          <Select value={collegeFilter} onValueChange={setCollegeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by College" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="ALL">All Colleges</SelectItem>
              {Object.values(CollegeEnum).map((c) => (
                <SelectItem key={c} value={c}>
                  {c.split("_").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full max-w-[600px]">
        {loading && page === 0 ? (
          <div className="w-full text-center py-10 flex justify-center">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 bg-muted/30 rounded-lg border border-dashed">
            No items found matching your criteria.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map(item => (
              <LostAndFoundCard 
                key={item.id} 
                item={item} 
                onUpdate={handleItemUpdated} 
              />
            ))}

            {hasMore && (
              <div ref={observerRef} className="text-center py-4 min-h-[50px] flex items-center justify-center">
                {(loading || fetchingMore) && <Spinner />}
              </div>
            )}
          </div>
        )}
      </div>

      <CreateLostAndFoundModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onSuccess={handleItemCreated} 
      />
    </div>
  );
}
