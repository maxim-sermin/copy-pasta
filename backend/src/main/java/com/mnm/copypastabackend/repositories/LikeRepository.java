package com.mnm.copypastabackend.repositories;

import com.mnm.copypastabackend.entities.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LikeRepository extends JpaRepository<Like, Like.LikeId> {

}
