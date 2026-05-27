package com.graduation.julink.lostandfound;


import com.graduation.julink.auth.CollegeEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface LostAndFoundRepository extends JpaRepository<LostAndFoundEntities.LostAndFound, UUID> {


    List<LostAndFoundEntities.LostAndFound> findByOwnerId(Long ownerId);
    
    Page<LostAndFoundEntities.LostAndFound> findByCollege(CollegeEnum college, Pageable pageable);
    
    Page<LostAndFoundEntities.LostAndFound> findByType(TypeEnum type, Pageable pageable);
    Page<LostAndFoundEntities.LostAndFound> findByIsResolved(boolean isResolved, Pageable pageable);
    
    Page<LostAndFoundEntities.LostAndFound> findByCollegeAndType(CollegeEnum college, TypeEnum type, Pageable pageable);
    Page<LostAndFoundEntities.LostAndFound> findByCollegeAndIsResolved(CollegeEnum college, boolean isResolved, Pageable pageable);
    Page<LostAndFoundEntities.LostAndFound> findByTypeAndIsResolved(TypeEnum type, boolean isResolved, Pageable pageable);
    
    Page<LostAndFoundEntities.LostAndFound> findByCollegeAndTypeAndIsResolved(CollegeEnum college, TypeEnum type, boolean isResolved, Pageable pageable);
}
