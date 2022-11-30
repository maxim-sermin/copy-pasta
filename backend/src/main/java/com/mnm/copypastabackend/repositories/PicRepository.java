package com.mnm.copypastabackend.repositories;

import com.mnm.copypastabackend.entities.Pic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PicRepository extends JpaRepository<Pic, Long> {

}
