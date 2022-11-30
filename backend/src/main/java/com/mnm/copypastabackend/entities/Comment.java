package com.mnm.copypastabackend.entities;

import java.time.LocalDateTime;

import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.validation.constraints.NotBlank;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sun.istack.NotNull;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "comments")
@ApiModel
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_fk")
    @JsonIgnore
    private Recipe recipe;

    @NotNull
    @JoinColumn(name = "user_fk")
    @ManyToOne(fetch = FetchType.EAGER)
    private User user;

    @Basic(optional = false)
    @Column(name = "content")
    @ApiModelProperty(notes = "The content of the comment", example = "Awesome recipe!")
    @NotBlank
    private String content;

    @Basic(optional = false)
    @Column(name = "comment_time")
    @ApiModelProperty(notes = "The date and time when this comment was created")
    private LocalDateTime commentTime;
}
