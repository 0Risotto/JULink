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
    Page<LostAndFoundEntities.LostAndFound> findByCollegeAndFound(CollegeEnum college, boolean found, Pageable pageable);

    Page<LostAndFoundEntities.LostAndFound> findByCollege(CollegeEnum college, Pageable pageable);

    Page<LostAndFoundEntities.LostAndFound> findByFound(boolean found, Pageable pageable);
}
