package com.graduation.julink.items;


import com.graduation.julink.auth.CollegeEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface ItemsRepository extends JpaRepository<ItemEntities.ItemEntity, UUID> {


    List<ItemEntities.ItemEntity> findByOwnerId(Long ownerId);
    Page<ItemEntities.ItemEntity> findByCollegeAndFound(CollegeEnum college, boolean found, Pageable pageable);

    Page<ItemEntities.ItemEntity> findByFound(boolean found, Pageable pageable);
}